import { createApp } from './app.js'
import type { Server } from 'elysia/universal/server'

const port = Number(process.env.PORT ?? 3000)
const hostname = process.env.HOST ?? '127.0.0.1'

if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error(
    `PORT must be an integer between 1 and 65535; received ${port}`,
  )
}

type NodeAdapterServer = Server & {
  raw?: {
    ready?: () => Promise<unknown>
  }
}

const waitUntilReady = async (server: Server) => {
  const raw = (server as NodeAdapterServer).raw

  if (raw?.ready) {
    await raw.ready()
  }

  return server
}

const server = await new Promise<Server>((resolve, reject) => {
  try {
    createApp().listen(
      { hostname, port, reusePort: false },
      (startedServer) =>
        void waitUntilReady(startedServer).then(resolve, reject),
    )
  } catch (error) {
    reject(error)
  }
})

console.info(`Lara API listening at ${server.url.href}`)

const stop = async (signal: NodeJS.Signals) => {
  console.info(`Received ${signal}; stopping Lara API`)
  await server.stop()
}

process.once('SIGINT', () => void stop('SIGINT'))
process.once('SIGTERM', () => void stop('SIGTERM'))
