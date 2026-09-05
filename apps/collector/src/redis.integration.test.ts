import { randomUUID } from 'node:crypto'
import { setTimeout as delay } from 'node:timers/promises'

import { MemoryDataStore } from '@lara/data-store'
import {
  createBullMqRuntime,
  nexonJobOptions,
  type ResolveCharacterJob,
} from '@lara/jobs'
import { createNodeRedisClient, UnrecoverableError, Worker } from 'bullmq'
import { createClient } from 'redis'
import { expect, it } from 'vitest'

import {
  reconcileFinalJobFailures,
  recordWorkerFailureIfFinal,
} from './failure-reconciliation.js'

const integrationTest = process.env.RUN_REDIS_TESTS === '1' ? it : it.skip

integrationTest(
  'UnrecoverableError는 남은 attempt와 무관하게 run을 실패 처리한다',
  async () => {
    const queueName = `lara-collector-test-${randomUUID()}`
    const redisUrl = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379'
    const runtime = await createBullMqRuntime(redisUrl, { queueName })
    const workerRedis = createClient({ url: redisUrl })
    await workerRedis.connect()
    const store = new MemoryDataStore()
    const run = await store.createCollectionRun({
      nickname: '라라',
      qos: 'interactive',
      createdAt: '2026-08-31T00:00:00.000Z',
    })
    const data: ResolveCharacterJob = {
      kind: 'resolve-character',
      runId: run.id,
      nickname: run.nickname,
      qos: run.qos,
    }
    const worker = new Worker<ResolveCharacterJob>(
      queueName,
      async () => {
        throw new UnrecoverableError('복구할 수 없는 오류')
      },
      { connection: createNodeRedisClient(workerRedis), concurrency: 1 },
    )

    try {
      await worker.waitUntilReady()
      const recorded = new Promise<{ final: boolean; attemptsMade: number }>(
        (resolve, reject) => {
          worker.once('failed', (job, error) => {
            if (!job) {
              reject(new Error('failed job 정보가 없습니다.'))
              return
            }
            void recordWorkerFailureIfFinal(job, store, error.message)
              .then((final) =>
                resolve({ final, attemptsMade: job.attemptsMade }),
              )
              .catch(reject)
          })
        },
      )

      await runtime.rawQueue.add(
        data.kind,
        data,
        nexonJobOptions(data.qos, `resolve-${run.id}`),
      )
      const result = await Promise.race([
        recorded,
        delay(10_000).then(() => {
          throw new Error('failed event 대기 시간이 초과됐습니다.')
        }),
      ])

      expect(result).toEqual({ final: true, attemptsMade: 1 })
      expect(await store.getCollectionRun(run.id)).toMatchObject({
        status: 'failed',
        message: '복구할 수 없는 오류',
      })
    } finally {
      await worker.close(true)
      await runtime.rawQueue.obliterate({ force: true })
      await runtime.close()
      await workerRedis.close()
    }
  },
  15_000,
)

integrationTest(
  'worker 강제 종료 뒤 stalled job의 최종 실패를 재조정한다',
  async () => {
    const queueName = `lara-collector-stall-test-${randomUUID()}`
    const redisUrl = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379'
    const runtime = await createBullMqRuntime(redisUrl, { queueName })
    const firstRedis = createClient({ url: redisUrl })
    const recoveryRedis = createClient({ url: redisUrl })
    await Promise.all([firstRedis.connect(), recoveryRedis.connect()])
    const store = new MemoryDataStore()
    const run = await store.createCollectionRun({
      nickname: '라라',
      qos: 'interactive',
      createdAt: '2026-08-31T00:00:00.000Z',
    })
    const data: ResolveCharacterJob = {
      kind: 'resolve-character',
      runId: run.id,
      nickname: run.nickname,
      qos: run.qos,
    }
    let markActive = () => {}
    const active = new Promise<void>((resolve) => {
      markActive = resolve
    })
    const firstWorker = new Worker<ResolveCharacterJob>(
      queueName,
      async () => {
        markActive()
        await new Promise(() => {})
      },
      {
        connection: createNodeRedisClient(firstRedis),
        lockDuration: 300,
        stalledInterval: 100,
        maxStalledCount: 0,
      },
    )
    let recoveryWorker: Worker<ResolveCharacterJob> | undefined

    try {
      await firstWorker.waitUntilReady()
      const job = await runtime.rawQueue.add(
        data.kind,
        data,
        nexonJobOptions(data.qos, `resolve-${run.id}`),
      )
      await Promise.race([
        active,
        delay(5_000).then(() => {
          throw new Error('active job 대기 시간이 초과됐습니다.')
        }),
      ])
      await firstWorker.close(true)

      recoveryWorker = new Worker<ResolveCharacterJob>(
        queueName,
        async () => undefined,
        {
          connection: createNodeRedisClient(recoveryRedis),
          lockDuration: 300,
          stalledInterval: 100,
          maxStalledCount: 0,
        },
      )
      await recoveryWorker.waitUntilReady()
      await waitForState(runtime.rawQueue, job.id ?? '', 'failed')

      await expect(
        reconcileFinalJobFailures(runtime.rawQueue, store),
      ).resolves.toEqual({ reconciled: 1, failed: 0 })
      expect(await store.getCollectionRun(run.id)).toMatchObject({
        status: 'failed',
      })
    } finally {
      await firstWorker.close(true)
      await recoveryWorker?.close(true)
      await runtime.rawQueue.obliterate({ force: true })
      await runtime.close()
      await Promise.all([firstRedis.close(), recoveryRedis.close()])
    }
  },
  20_000,
)

const waitForState = async (
  queue: { getJobState(jobId: string): Promise<string> },
  jobId: string,
  expected: string,
) => {
  const deadline = Date.now() + 10_000
  while (Date.now() < deadline) {
    if ((await queue.getJobState(jobId)) === expected) return
    await delay(50)
  }
  throw new Error(`job 상태가 ${expected}(으)로 바뀌지 않았습니다.`)
}
