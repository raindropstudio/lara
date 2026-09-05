import type { DataStore } from '@lara/data-store'
import type { NexonFetchQueue } from '@lara/jobs'

export type QueuedRunReconciliationOptions = {
  staleAfterMs: number
  limit: number
  now?: () => Date
  onError?: (runId: string, error: unknown) => void
}

export const reconcileQueuedCollectionRuns = async (
  store: DataStore,
  queue: NexonFetchQueue,
  options: QueuedRunReconciliationOptions,
) => {
  const now = options.now?.() ?? new Date()
  const queuedRuns = await store.findQueuedCollectionRuns({
    updatedBefore: new Date(now.getTime() - options.staleAfterMs).toISOString(),
    limit: options.limit,
  })

  let attempted = 0
  let failed = 0
  for (const run of queuedRuns) {
    try {
      await queue.enqueueCollection({
        kind: 'resolve-character',
        runId: run.id,
        nickname: run.nickname,
        qos: run.qos,
      })
      await store.recordCollectionDispatchAttempt({
        runId: run.id,
        expectedUpdatedAt: run.updatedAt,
        attemptedAt: now.toISOString(),
      })
      attempted += 1
    } catch (error: unknown) {
      failed += 1
      options.onError?.(run.id, error)
    }
  }

  return { attempted, failed }
}
