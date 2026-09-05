import { createNodeRedisClient, Queue, type JobsOptions } from 'bullmq'
import { createClient, type RedisClientType } from 'redis'

import {
  NEXON_FETCH_QUEUE,
  qosPriority,
  type FetchCharacterSectionJob,
  type NexonFetchJob,
  type NexonFetchQueue,
  type ResolveCharacterJob,
} from './contracts.js'

export type NexonBulkJob = {
  name: string
  data: NexonFetchJob
  opts: JobsOptions
}

export interface NexonQueuePort {
  add(name: string, data: NexonFetchJob, opts: JobsOptions): Promise<unknown>
  addBulk(jobs: NexonBulkJob[]): Promise<unknown>
  setGlobalConcurrency(concurrency: number): Promise<unknown>
  setGlobalRateLimit(max: number, duration: number): Promise<unknown>
  close(): Promise<void>
}

export const nexonJobOptions = (
  qos: NexonFetchJob['qos'],
  jobId: string,
): JobsOptions => ({
  jobId,
  priority: qosPriority[qos],
  attempts: 5,
  backoff: {
    type: 'exponential',
    delay: 1_000,
    jitter: 0.5,
  },
  removeOnComplete: { age: 3_600, count: 10_000 },
  removeOnFail: { age: 86_400, count: 50_000 },
})

export class BullMqNexonFetchQueue implements NexonFetchQueue {
  constructor(private readonly queue: NexonQueuePort) {}

  async configure(input: {
    requests: number
    durationMs: number
    concurrency: number
  }) {
    await Promise.all([
      this.queue.setGlobalRateLimit(input.requests, input.durationMs),
      this.queue.setGlobalConcurrency(input.concurrency),
    ])
  }

  async enqueueCollection(input: ResolveCharacterJob) {
    await this.queue.add(
      input.kind,
      input,
      nexonJobOptions(input.qos, `resolve-${input.runId}`),
    )
  }

  async enqueueSections(input: readonly FetchCharacterSectionJob[]) {
    if (input.length === 0) return
    await this.queue.addBulk(
      input.map((data) => ({
        name: data.kind,
        data,
        opts: nexonJobOptions(
          data.qos,
          `section-${data.runId}-${data.sectionId}`,
        ),
      })),
    )
  }

  close() {
    return this.queue.close()
  }
}

export type BullMqRuntime = {
  queue: BullMqNexonFetchQueue
  rawQueue: Queue<NexonFetchJob>
  redis: RedisClientType
  close: () => Promise<void>
}

export type BullMqRuntimeOptions = {
  queueName?: string
}

export const createBullMqRuntime = async (
  redisUrl: string,
  options: BullMqRuntimeOptions = {},
): Promise<BullMqRuntime> => {
  const redis = createClient({ url: redisUrl })
  await redis.connect()
  const rawQueue = new Queue<NexonFetchJob>(
    options.queueName ?? NEXON_FETCH_QUEUE,
    {
      connection: createNodeRedisClient(redis),
    },
  )
  const queue = new BullMqNexonFetchQueue(rawQueue)
  return {
    queue,
    rawQueue,
    redis,
    close: async () => {
      await rawQueue.close()
      await redis.close()
    },
  }
}
