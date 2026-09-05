import { CharacterCollector } from '@lara/character-pipeline'
import { MongoDataStore } from '@lara/data-store'
import {
  createBullMqRuntime,
  NEXON_FETCH_QUEUE,
  type NexonFetchJob,
} from '@lara/jobs'
import { createFetchNexonClient } from '@lara/nexon-client'
import { createNodeRedisClient, Worker } from 'bullmq'
import { createClient } from 'redis'

import {
  reconcileFinalJobFailures,
  recordWorkerFailureIfFinal,
} from './failure-reconciliation.js'
import { createNexonJobProcessor } from './processor.js'
import { reconcileQueuedCollectionRuns } from './queued-run-reconciliation.js'

const required = (name: string) => {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} 환경 변수가 필요합니다.`)
  return value
}

const positiveInteger = (name: string, fallback: number) => {
  const value = Number(process.env[name] ?? fallback)
  if (!Number.isInteger(value) || value <= 0)
    throw new Error(`${name}은 양의 정수여야 합니다.`)
  return value
}

const redisUrl = required('REDIS_URL')
const store = await MongoDataStore.connect(
  required('MONGODB_URI'),
  process.env.MONGODB_DATABASE ?? 'lara',
)
await store.ensureIndexes()
const queueRuntime = await createBullMqRuntime(redisUrl)
const rateLimit = {
  max: positiveInteger('NEXON_RATE_LIMIT_REQUESTS', 50),
  duration: positiveInteger('NEXON_RATE_LIMIT_DURATION_MS', 1_000),
}
await queueRuntime.queue.configure({
  requests: rateLimit.max,
  durationMs: rateLimit.duration,
  concurrency: positiveInteger('NEXON_GLOBAL_CONCURRENCY', 20),
})

const collector = new CharacterCollector({
  client: createFetchNexonClient({ apiKey: required('NEXON_API_KEY') }),
  store,
})
const workerRedis = createClient({ url: redisUrl })
await workerRedis.connect()

const processor = createNexonJobProcessor({
  collector,
  queue: queueRuntime.queue,
  store,
  rateLimit: async (durationMs) => {
    await worker.rateLimit(durationMs)
    throw Worker.RateLimitError()
  },
})

const worker = new Worker<NexonFetchJob>(
  NEXON_FETCH_QUEUE,
  async (job) => processor(job.data),
  {
    connection: createNodeRedisClient(workerRedis),
    autorun: false,
    concurrency: positiveInteger('COLLECTOR_CONCURRENCY', 20),
    limiter: rateLimit,
  },
)

const seenFailedJobIds = new Set<string>()
let lastFailedReconciliationAt = 0
const pendingFailureWrites = new Set<Promise<unknown>>()
const trackFailureWrite = (operation: Promise<unknown>) => {
  pendingFailureWrites.add(operation)
  void operation
    .catch((error: unknown) => {
      console.error('Collector failure state write error', error)
    })
    .finally(() => pendingFailureWrites.delete(operation))
}

worker.on('failed', (job, error) => {
  if (!job) {
    lastFailedReconciliationAt = 0
    return
  }
  trackFailureWrite(
    recordWorkerFailureIfFinal(job, store, error.message).catch(
      (writeError: unknown) => {
        lastFailedReconciliationAt = 0
        throw writeError
      },
    ),
  )
})

worker.on('error', (error) => {
  console.error('Collector worker error', error)
})

let activeReconciliation: Promise<number> | undefined
const reconcileState = (forceFailedScan = false) => {
  activeReconciliation ??= (async () => {
    const failedReconcileInterval = positiveInteger(
      'COLLECTOR_FAILED_RECONCILE_INTERVAL_MS',
      300_000,
    )
    const scanFailedJobs =
      forceFailedScan ||
      Date.now() - lastFailedReconciliationAt >= failedReconcileInterval
    const [failedResult, queuedResult] = await Promise.allSettled([
      scanFailedJobs
        ? reconcileFinalJobFailures(
            queueRuntime.rawQueue,
            store,
            seenFailedJobIds,
            () => new Date(),
            (jobId, error) => {
              console.error(
                `Failed job 상태 기록 실패: ${jobId ?? 'unknown'}`,
                error,
              )
            },
          )
        : Promise.resolve({ reconciled: 0, failed: 0 }),
      reconcileQueuedCollectionRuns(store, queueRuntime.queue, {
        staleAfterMs: positiveInteger('COLLECTOR_QUEUED_STALE_MS', 60_000),
        limit: positiveInteger('COLLECTOR_RECONCILE_BATCH_SIZE', 100),
        onError: (runId, error) => {
          console.error(`Queued run 재등록 실패: ${runId}`, error)
        },
      }),
    ])
    const failed =
      failedResult.status === 'fulfilled' ? failedResult.value.reconciled : 0
    const queued =
      queuedResult.status === 'fulfilled' ? queuedResult.value.attempted : 0
    if (scanFailedJobs && failedResult.status === 'fulfilled') {
      lastFailedReconciliationAt =
        failedResult.value.failed === 0 ? Date.now() : 0
    } else if (failedResult.status === 'rejected') {
      lastFailedReconciliationAt = 0
      console.error('Failed job 재조정 실패', failedResult.reason)
    }
    if (queuedResult.status === 'rejected')
      console.error('Queued run 재조정 실패', queuedResult.reason)
    if (failed > 0 || queued > 0) {
      console.info(
        `Reconciled collector state: ${failed} failed, ${queued} queued`,
      )
    }
    return failed + queued
  })()
    .then((count) => {
      while (seenFailedJobIds.size > 50_000) {
        const oldest = seenFailedJobIds.values().next().value
        if (oldest === undefined) break
        seenFailedJobIds.delete(oldest)
      }
      return count
    })
    .finally(() => {
      activeReconciliation = undefined
    })
  return activeReconciliation
}

await reconcileState(true)
let stopping: Promise<void> | undefined

const drainPendingFailureWrites = async () => {
  while (pendingFailureWrites.size > 0) {
    await Promise.allSettled([...pendingFailureWrites])
  }
}

const stop = (reason: NodeJS.Signals | 'WORKER_ERROR') => {
  if (stopping) return stopping

  stopping = (async () => {
    console.info(`Received ${reason}; stopping Lara collector`)
    clearInterval(failureReconcileTimer)

    const close = async (name: string, operation: () => Promise<unknown>) => {
      try {
        await operation()
      } catch (error) {
        process.exitCode = 1
        console.error(`${name} 종료 실패`, error)
      }
    }

    await close('Collector worker', () => worker.close())
    await drainPendingFailureWrites()
    await Promise.all([
      close('Collector queue', () => queueRuntime.close()),
      close('Collector Redis', () => workerRedis.close()),
      close('Collector store', () => store.close()),
    ])
  })()

  return stopping
}

void worker.run().catch(async (error: unknown) => {
  process.exitCode = 1
  console.error('Collector worker stopped unexpectedly', error)
  await stop('WORKER_ERROR')
})
const failureReconcileTimer = setInterval(
  () => {
    trackFailureWrite(reconcileState())
  },
  positiveInteger('COLLECTOR_RECONCILE_INTERVAL_MS', 30_000),
)
failureReconcileTimer.unref()

console.info('Lara collector started')

process.once('SIGINT', () => void stop('SIGINT'))
process.once('SIGTERM', () => void stop('SIGTERM'))
