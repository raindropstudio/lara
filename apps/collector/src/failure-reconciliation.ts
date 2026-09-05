import type { DataStore } from '@lara/data-store'
import type { NexonFetchJob } from '@lara/jobs'

import { recordFinalJobFailure } from './processor.js'

export type FailedJob = {
  id?: string
  data: NexonFetchJob
  failedReason?: string
  isFailed(): Promise<boolean>
}

export type FailedJobSource = {
  getFailed(start?: number, end?: number): Promise<readonly FailedJob[]>
}

export const recordWorkerFailureIfFinal = async (
  job: FailedJob,
  store: DataStore,
  message: string,
  now = new Date(),
) => {
  if (!(await job.isFailed())) return false
  await recordFinalJobFailure(job.data, store, message, now)
  return true
}

export const reconcileFinalJobFailures = async (
  source: FailedJobSource,
  store: DataStore,
  seenJobIds = new Set<string>(),
  now = () => new Date(),
  onError?: (jobId: string | undefined, error: unknown) => void,
) => {
  const batchSize = 100
  const discoveredJobIds: string[] = []
  let start = 0
  let reconciled = 0
  let failed = 0

  while (true) {
    const jobs = await source.getFailed(start, start + batchSize - 1)
    for (const job of jobs) {
      if (job.id !== undefined && seenJobIds.has(job.id)) {
        continue
      }
      try {
        await recordFinalJobFailure(
          job.data,
          store,
          job.failedReason ?? '수집 job 최종 실패',
          now(),
        )
        if (job.id !== undefined) discoveredJobIds.push(job.id)
        reconciled += 1
      } catch (error: unknown) {
        failed += 1
        onError?.(job.id, error)
      }
    }
    if (jobs.length < batchSize) {
      for (const id of discoveredJobIds) seenJobIds.add(id)
      return { reconciled, failed }
    }
    start += jobs.length
  }
}
