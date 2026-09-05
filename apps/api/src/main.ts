import { MemoryDataStore, MongoDataStore } from '@lara/data-store'
import { createBullMqRuntime } from '@lara/jobs'

import { createApp, parseCorsOrigins } from './app.js'
import { getServerUrl, startServer } from './server.js'

const port = Number(process.env.PORT ?? 3001)
const hostname = process.env.HOST ?? '127.0.0.1'

if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error(
    `PORT must be an integer between 1 and 65535; received ${port}`,
  )
}

const store = process.env.MONGODB_URI
  ? await MongoDataStore.connect(
      process.env.MONGODB_URI,
      process.env.MONGODB_DATABASE ?? 'lara',
    )
  : new MemoryDataStore()

await store.ensureIndexes()

const redisUrl = process.env.REDIS_URL?.trim()
const queueRuntime = redisUrl ? await createBullMqRuntime(redisUrl) : undefined

if (!process.env.MONGODB_URI) {
  console.warn('MONGODB_URI가 없어 API 데이터를 메모리에 저장합니다.')
}
if (!queueRuntime) {
  console.warn('REDIS_URL이 없어 수집 요청 API를 비활성화합니다.')
}

const server = await startServer(
  createApp({
    store,
    checkReadiness: async () => {
      const [storeReady, redisReady] = await Promise.all([
        store.isReady(),
        queueRuntime
          ? queueRuntime.redis
              .ping()
              .then((response) => response === 'PONG')
              .catch(() => false)
          : Promise.resolve(false),
      ])
      return storeReady && redisReady
    },
    corsOrigins: parseCorsOrigins(process.env.CORS_ORIGINS),
    ...(queueRuntime ? { queue: queueRuntime.queue } : {}),
  }),
  { hostname, port },
)

console.info(`Lara API listening at ${getServerUrl(server).href}`)

const stop = async (signal: NodeJS.Signals) => {
  console.info(`Received ${signal}; stopping Lara API`)
  await server.stop()
  await queueRuntime?.close()
  await store.close()
}

process.once('SIGINT', () => void stop('SIGINT'))
process.once('SIGTERM', () => void stop('SIGTERM'))
