import { MemoryDataStore } from '@lara/data-store'
import type {
  FetchCharacterSectionJob,
  NexonFetchQueue,
  ResolveCharacterJob,
} from '@lara/jobs'
import { describe, expect, it, vi } from 'vitest'

import { reconcileQueuedCollectionRuns } from './queued-run-reconciliation.js'

const fakeQueue = () => {
  const jobs: ResolveCharacterJob[] = []
  const queue: NexonFetchQueue = {
    async enqueueCollection(input) {
      jobs.push(input)
    },
    async enqueueSections(input: readonly FetchCharacterSectionJob[]) {
      void input
    },
  }
  return { jobs, queue }
}

describe('queued run 재조정', () => {
  it('오래된 queued run을 같은 runId로 다시 enqueue하고 시각을 갱신한다', async () => {
    const store = new MemoryDataStore()
    const old = await store.createCollectionRun({
      nickname: '오래된대기',
      qos: 'interactive',
      createdAt: '2026-08-31T00:00:00.000Z',
    })
    await store.createCollectionRun({
      nickname: '새대기',
      qos: 'repair',
      createdAt: '2026-08-31T00:00:50.000Z',
    })
    const { jobs, queue } = fakeQueue()

    await expect(
      reconcileQueuedCollectionRuns(store, queue, {
        staleAfterMs: 30_000,
        limit: 100,
        now: () => new Date('2026-08-31T00:01:00.000Z'),
      }),
    ).resolves.toEqual({ attempted: 1, failed: 0 })
    expect(jobs).toEqual([
      {
        kind: 'resolve-character',
        runId: old.id,
        nickname: old.nickname,
        qos: old.qos,
      },
    ])
    expect(await store.getCollectionRun(old.id)).toMatchObject({
      status: 'queued',
      sequence: 1,
      updatedAt: '2026-08-31T00:01:00.000Z',
    })
  })

  it('enqueue 실패 시 다음 재조정을 위해 queued 상태를 유지한다', async () => {
    const store = new MemoryDataStore()
    const run = await store.createCollectionRun({
      nickname: '재시도대기',
      qos: 'daily-top',
      createdAt: '2026-08-31T00:00:00.000Z',
    })
    const queue = fakeQueue().queue
    queue.enqueueCollection = vi.fn(async () => {
      throw new Error('Redis 연결 실패')
    })

    await expect(
      reconcileQueuedCollectionRuns(store, queue, {
        staleAfterMs: 30_000,
        limit: 100,
        now: () => new Date('2026-08-31T00:01:00.000Z'),
      }),
    ).resolves.toEqual({ attempted: 0, failed: 1 })
    expect(await store.getCollectionRun(run.id)).toMatchObject({
      status: 'queued',
      sequence: 0,
    })
  })
})
