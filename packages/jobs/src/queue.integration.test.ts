import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'

import type { BullMqRuntime } from './queue.js'
import { createBullMqRuntime } from './queue.js'

const describeRedis =
  process.env.RUN_REDIS_TESTS === '1' ? describe : describe.skip

const redisUrl = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379'

const withIsolatedQueue = async (
  assertion: (runtime: BullMqRuntime) => Promise<void>,
) => {
  const queueName = `lara-test-nexon-fetch-${process.pid}-${randomUUID()}`
  const runtime = await createBullMqRuntime(redisUrl, { queueName })

  try {
    await assertion(runtime)
  } finally {
    try {
      await runtime.rawQueue.obliterate({ force: true })
    } finally {
      await runtime.close()
    }
  }
}

describeRedis('Nexon fetch queue Redis integration', () => {
  it('global rate limit과 concurrency를 Redis에 저장한다', async () => {
    await withIsolatedQueue(async ({ queue, rawQueue }) => {
      await queue.configure({
        requests: 7,
        durationMs: 1_234,
        concurrency: 3,
      })

      await expect(rawQueue.getGlobalRateLimit()).resolves.toEqual({
        max: 7,
        duration: 1_234,
      })
      await expect(rawQueue.getGlobalConcurrency()).resolves.toBe(3)
    })
  })

  it('동일한 수집 identity를 한 번만 enqueue한다', async () => {
    await withIsolatedQueue(async ({ queue, rawQueue }) => {
      const collection = {
        kind: 'resolve-character' as const,
        runId: 'run-integration-1',
        nickname: '라라',
        qos: 'interactive' as const,
      }
      const section = {
        kind: 'fetch-character-section' as const,
        runId: collection.runId,
        nickname: collection.nickname,
        ocid: 'ocid-integration-1',
        sectionId: 'characterBasic' as const,
        qos: collection.qos,
      }

      await queue.enqueueCollection(collection)
      await queue.enqueueCollection(collection)
      await queue.enqueueSections([section])
      await queue.enqueueSections([section])

      await expect(
        rawQueue.getJobCountByTypes('waiting', 'prioritized'),
      ).resolves.toBe(2)
      await expect(
        rawQueue.getJob(`resolve-${collection.runId}`),
      ).resolves.toMatchObject({
        data: collection,
        opts: { priority: 1 },
      })
      await expect(
        rawQueue.getJob(`section-${section.runId}-${section.sectionId}`),
      ).resolves.toMatchObject({
        data: section,
        opts: { priority: 1 },
      })
    })
  })
})
