import { MemoryDataStore } from '@lara/data-store'
import type { ResolveCharacterJob } from '@lara/jobs'
import { describe, expect, it, vi } from 'vitest'

import {
  reconcileFinalJobFailures,
  recordWorkerFailureIfFinal,
  type FailedJob,
} from './failure-reconciliation.js'

const createRunAndJob = async (store: MemoryDataStore, nickname = '라라') => {
  const run = await store.createCollectionRun({
    nickname,
    qos: 'interactive',
    createdAt: '2026-08-31T00:00:00.000Z',
  })
  const data: ResolveCharacterJob = {
    kind: 'resolve-character',
    runId: run.id,
    nickname: run.nickname,
    qos: run.qos,
  }
  return { run, data }
}

describe('collector 최종 실패 재조정', () => {
  it('재시도 대기 중인 failed event는 run을 종료하지 않는다', async () => {
    const store = new MemoryDataStore()
    const { run, data } = await createRunAndJob(store)
    const job: FailedJob = {
      id: 'resolve-1',
      data,
      isFailed: vi.fn(async () => false),
    }

    await expect(
      recordWorkerFailureIfFinal(
        job,
        store,
        '재시도 예정',
        new Date('2026-08-31T00:00:01.000Z'),
      ),
    ).resolves.toBe(false)
    expect(await store.getCollectionRun(run.id)).toMatchObject({
      status: 'queued',
      completed: 0,
    })
  })

  it('attempt 수와 무관하게 실제 failed 상태를 run에 반영한다', async () => {
    const store = new MemoryDataStore()
    const { run, data } = await createRunAndJob(store)
    const job: FailedJob = {
      id: 'resolve-2',
      data,
      isFailed: vi.fn(async () => true),
    }

    await expect(
      recordWorkerFailureIfFinal(
        job,
        store,
        '복구할 수 없는 오류',
        new Date('2026-08-31T00:00:01.000Z'),
      ),
    ).resolves.toBe(true)
    expect(await store.getCollectionRun(run.id)).toMatchObject({
      status: 'failed',
      message: '복구할 수 없는 오류',
    })
  })

  it('worker가 놓친 failed job을 다시 읽고 한 번만 반영한다', async () => {
    const store = new MemoryDataStore()
    const { run, data } = await createRunAndJob(store)
    const job: FailedJob = {
      id: 'resolve-3',
      data,
      failedReason: 'worker 종료 중 실패',
      isFailed: vi.fn(async () => true),
    }
    const source = { getFailed: vi.fn(async () => [job]) }
    const seen = new Set<string>()

    await expect(
      reconcileFinalJobFailures(
        source,
        store,
        seen,
        () => new Date('2026-08-31T00:00:01.000Z'),
      ),
    ).resolves.toEqual({ reconciled: 1, failed: 0 })
    await expect(
      reconcileFinalJobFailures(source, store, seen),
    ).resolves.toEqual({ reconciled: 0, failed: 0 })
    expect(await store.getCollectionRun(run.id)).toMatchObject({
      status: 'failed',
      message: 'worker 종료 중 실패',
    })
  })

  it('알고 있는 job과 같은 page의 새 실패를 건너뛰지 않는다', async () => {
    const store = new MemoryDataStore()
    const known = await createRunAndJob(store, '알려진작업')
    const unseen = await createRunAndJob(store, '새작업')
    const source = {
      getFailed: vi.fn(async () => [
        {
          id: 'known',
          data: known.data,
          isFailed: async () => true,
        },
        {
          id: 'unseen',
          data: unseen.data,
          failedReason: '놓친 실패',
          isFailed: async () => true,
        },
      ]),
    }

    await expect(
      reconcileFinalJobFailures(
        source,
        store,
        new Set(['known']),
        () => new Date('2026-08-31T00:00:01.000Z'),
      ),
    ).resolves.toEqual({ reconciled: 1, failed: 0 })
    expect(await store.getCollectionRun(unseen.run.id)).toMatchObject({
      status: 'failed',
      message: '놓친 실패',
    })
  })

  it('한 상태 기록 오류가 뒤의 failed job 복구를 막지 않는다', async () => {
    const store = new MemoryDataStore()
    const poisoned = await createRunAndJob(store, '오류작업')
    const healthy = await createRunAndJob(store, '정상작업')
    const failCollectionRun = store.failCollectionRun.bind(store)
    store.failCollectionRun = vi.fn(async (input) => {
      if (input.runId === poisoned.run.id) throw new Error('Mongo 일시 오류')
      return failCollectionRun(input)
    })
    const onError = vi.fn()
    const source = {
      getFailed: vi.fn(async () => [
        {
          id: 'poisoned',
          data: poisoned.data,
          isFailed: async () => true,
        },
        {
          id: 'healthy',
          data: healthy.data,
          isFailed: async () => true,
        },
      ]),
    }

    await expect(
      reconcileFinalJobFailures(
        source,
        store,
        new Set(),
        () => new Date('2026-08-31T00:00:01.000Z'),
        onError,
      ),
    ).resolves.toEqual({ reconciled: 1, failed: 1 })
    expect(onError).toHaveBeenCalledWith('poisoned', expect.any(Error))
    expect(await store.getCollectionRun(healthy.run.id)).toMatchObject({
      status: 'failed',
    })
    expect(await store.getCollectionRun(poisoned.run.id)).toMatchObject({
      status: 'queued',
    })
  })
})
