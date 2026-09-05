import { describe, expect, it, vi } from 'vitest'

import { qosPriority, type FetchCharacterSectionJob } from './contracts.js'
import {
  BullMqNexonFetchQueue,
  type NexonBulkJob,
  type NexonQueuePort,
} from './queue.js'

const fakeQueue = () => {
  const queue = {
    add: vi.fn(async () => undefined),
    addBulk: vi.fn(async (jobs: NexonBulkJob[]) => {
      void jobs
    }),
    setGlobalConcurrency: vi.fn(async () => undefined),
    setGlobalRateLimit: vi.fn(async () => undefined),
    close: vi.fn(async () => undefined),
  } satisfies NexonQueuePort
  return queue
}

describe('Nexon fetch queue', () => {
  it('모든 QoS에 양수 우선순위를 지정한다', () => {
    expect(Object.values(qosPriority).every((value) => value > 0)).toBe(true)
    expect(qosPriority.interactive).toBeLessThan(qosPriority['daily-top'])
    expect(qosPriority['daily-top']).toBeLessThan(qosPriority.backfill)
  })

  it('collection과 section에 결정적인 job id를 사용한다', async () => {
    const raw = fakeQueue()
    const queue = new BullMqNexonFetchQueue(raw)
    await queue.enqueueCollection({
      kind: 'resolve-character',
      runId: 'run-1',
      nickname: '라라',
      qos: 'interactive',
    })
    const sections: FetchCharacterSectionJob[] = [
      {
        kind: 'fetch-character-section',
        runId: 'run-1',
        nickname: '라라',
        ocid: 'ocid-1',
        sectionId: 'characterBasic',
        qos: 'interactive',
      },
    ]
    await queue.enqueueSections(sections)

    expect(raw.add).toHaveBeenCalledWith(
      'resolve-character',
      expect.anything(),
      expect.objectContaining({ jobId: 'resolve-run-1', priority: 1 }),
    )
    expect(raw.addBulk.mock.calls[0]?.[0]?.[0]?.opts).toEqual(
      expect.objectContaining({
        jobId: 'section-run-1-characterBasic',
        priority: 1,
      }),
    )
  })

  it('queue 전체 rate limit과 동시성을 설정한다', async () => {
    const raw = fakeQueue()
    const queue = new BullMqNexonFetchQueue(raw)
    await queue.configure({ requests: 50, durationMs: 1_000, concurrency: 20 })

    expect(raw.setGlobalRateLimit).toHaveBeenCalledWith(50, 1_000)
    expect(raw.setGlobalConcurrency).toHaveBeenCalledWith(20)
  })
})
