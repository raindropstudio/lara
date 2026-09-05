import type {
  CharacterCollectionReport,
  TargetCollectionResult,
} from '@lara/character-pipeline'
import { fullCharacterTargets } from '@lara/character-pipeline'
import { MemoryDataStore } from '@lara/data-store'
import type { FetchCharacterSectionJob, NexonFetchQueue } from '@lara/jobs'
import { describe, expect, it, vi } from 'vitest'

import { createNexonJobProcessor, type CollectorPort } from './processor.js'

const fakeQueue = () => {
  const sections: FetchCharacterSectionJob[] = []
  const queue: NexonFetchQueue = {
    async enqueueCollection() {},
    async enqueueSections(input) {
      sections.push(...input)
    },
  }
  return { queue, sections }
}

const resolvedReport: CharacterCollectionReport = {
  nickname: '라라',
  ocid: 'ocid-1',
  status: 'complete',
  sections: [],
}

describe('collector processor', () => {
  it('OCID 확인 뒤 endpoint별 job을 생성한다', async () => {
    const store = new MemoryDataStore()
    const run = await store.createCollectionRun({
      nickname: '라라',
      qos: 'interactive',
      createdAt: '2026-08-31T00:00:00.000Z',
    })
    const collector = {
      collect: vi.fn(async () => resolvedReport),
      collectTarget: vi.fn(),
    } as unknown as CollectorPort
    const { queue, sections } = fakeQueue()
    const processor = createNexonJobProcessor({
      collector,
      queue,
      store,
      now: () => new Date('2026-08-31T00:00:01.000Z'),
    })

    await processor({
      kind: 'resolve-character',
      runId: run.id,
      nickname: '라라',
      qos: 'interactive',
    })

    expect(sections).toHaveLength(fullCharacterTargets.length)
    expect(await store.getCollectionRun(run.id)).toMatchObject({
      status: 'running',
      total: fullCharacterTargets.length,
      completed: 0,
      succeeded: 0,
      partial: 0,
    })
  })

  it('terminal run 재실행은 하위 job을 다시 만들지 않는다', async () => {
    const store = new MemoryDataStore()
    const run = await store.createCollectionRun({
      nickname: '라라',
      qos: 'interactive',
      createdAt: '2026-08-31T00:00:00.000Z',
    })
    await store.startCollectionRun({
      runId: run.id,
      total: 1,
      updatedAt: '2026-08-31T00:00:01.000Z',
    })
    await store.recordCollectionStep({
      runId: run.id,
      stepId: 'characterBasic',
      outcome: 'succeeded',
      updatedAt: '2026-08-31T00:00:02.000Z',
    })
    const collector = {
      collect: vi.fn(async () => resolvedReport),
      collectTarget: vi.fn(),
    } as unknown as CollectorPort
    const { queue, sections } = fakeQueue()
    const processor = createNexonJobProcessor({ collector, queue, store })

    await processor({
      kind: 'resolve-character',
      runId: run.id,
      nickname: '라라',
      qos: 'interactive',
    })

    expect(sections).toEqual([])
    expect(collector.collect).not.toHaveBeenCalled()
    expect(await store.getCollectionRun(run.id)).toMatchObject({
      status: 'completed',
      total: 1,
      completed: 1,
    })
  })

  it('이미 완료한 section job은 upstream을 다시 호출하지 않는다', async () => {
    const store = new MemoryDataStore()
    const run = await store.createCollectionRun({
      nickname: '라라',
      qos: 'interactive',
      createdAt: '2026-08-31T00:00:00.000Z',
    })
    await store.startCollectionRun({
      runId: run.id,
      total: 2,
      updatedAt: '2026-08-31T00:00:01.000Z',
    })
    const before = await store.recordCollectionStep({
      runId: run.id,
      stepId: 'characterBasic',
      outcome: 'succeeded',
      updatedAt: '2026-08-31T00:00:02.000Z',
    })
    const collector = {
      collect: vi.fn(),
      collectTarget: vi.fn(),
    } as unknown as CollectorPort
    const { queue } = fakeQueue()
    const processor = createNexonJobProcessor({ collector, queue, store })

    await processor({
      kind: 'fetch-character-section',
      runId: run.id,
      nickname: '라라',
      ocid: 'ocid-1',
      sectionId: 'characterBasic',
      qos: 'interactive',
    })

    expect(collector.collectTarget).not.toHaveBeenCalled()
    expect(await store.getCollectionRun(run.id)).toEqual(before)
  })

  it('429에서는 동적 rate limit을 요청한다', async () => {
    const store = new MemoryDataStore()
    const run = await store.createCollectionRun({
      nickname: '라라',
      qos: 'interactive',
      createdAt: '2026-08-31T00:00:00.000Z',
    })
    await store.startCollectionRun({
      runId: run.id,
      total: 2,
      updatedAt: '2026-08-31T00:00:00.000Z',
    })
    const { queue } = fakeQueue()
    const limited = new Error('rate-limited')
    const rateLimit = vi.fn(async () => {
      throw limited
    })
    const targetResult: TargetCollectionResult = {
      target: fullCharacterTargets[0],
      report: {
        sectionId: 'characterBasic',
        status: 'unavailable',
        issueCount: 1,
        upstreamStatus: 429,
        retryAfterMs: 2_000,
      },
    }
    const collector = {
      collect: vi.fn(),
      collectTarget: vi.fn(async () => targetResult),
    } as unknown as CollectorPort
    const processor = createNexonJobProcessor({
      collector,
      queue,
      store,
      rateLimit,
    })

    await expect(
      processor({
        kind: 'fetch-character-section',
        runId: run.id,
        nickname: '라라',
        ocid: 'ocid-1',
        sectionId: 'characterBasic',
        qos: 'interactive',
      }),
    ).rejects.toBe(limited)
    expect(rateLimit).toHaveBeenCalledWith(2_000)
  })

  it('OCID 429도 attempt를 소비하지 않고 rate limit한다', async () => {
    const store = new MemoryDataStore()
    const run = await store.createCollectionRun({
      nickname: '라라',
      qos: 'interactive',
      createdAt: '2026-08-31T00:00:00.000Z',
    })
    const { queue } = fakeQueue()
    const limited = new Error('rate-limited')
    const rateLimit = vi.fn(async () => {
      throw limited
    })
    const collector = {
      collect: vi.fn(async () => ({
        nickname: '라라',
        status: 'failed',
        sections: [
          {
            sectionId: 'characterOcid',
            status: 'unavailable',
            issueCount: 1,
            upstreamStatus: 429,
            retryAfterMs: 3_000,
          },
        ],
      })),
      collectTarget: vi.fn(),
    } as unknown as CollectorPort
    const processor = createNexonJobProcessor({
      collector,
      queue,
      store,
      rateLimit,
    })

    await expect(
      processor({
        kind: 'resolve-character',
        runId: run.id,
        nickname: '라라',
        qos: 'interactive',
      }),
    ).rejects.toBe(limited)
    expect(rateLimit).toHaveBeenCalledWith(3_000)
    expect(await store.getCollectionRun(run.id)).toMatchObject({
      status: 'queued',
      completed: 0,
    })
  })

  it('영구 OCID 오류는 재시도 대신 run을 종료한다', async () => {
    const store = new MemoryDataStore()
    const run = await store.createCollectionRun({
      nickname: '없는이름',
      qos: 'interactive',
      createdAt: '2026-08-31T00:00:00.000Z',
    })
    const { queue } = fakeQueue()
    const collector = {
      collect: vi.fn(async () => ({
        nickname: '없는이름',
        status: 'failed',
        sections: [
          {
            sectionId: 'characterOcid',
            status: 'unavailable',
            issueCount: 1,
            upstreamStatus: 400,
            nexonErrorCode: 'OPENAPI00003',
          },
        ],
      })),
      collectTarget: vi.fn(),
    } as unknown as CollectorPort
    const processor = createNexonJobProcessor({ collector, queue, store })

    await processor({
      kind: 'resolve-character',
      runId: run.id,
      nickname: '없는이름',
      qos: 'interactive',
    })

    expect(await store.getCollectionRun(run.id)).toMatchObject({
      status: 'failed',
      completed: 1,
      failed: 1,
      partial: 0,
      message: '캐릭터 OCID를 확인할 수 없습니다.',
    })
  })

  it('parser 실패는 다른 section과 별도로 진행률에 기록한다', async () => {
    const store = new MemoryDataStore()
    const run = await store.createCollectionRun({
      nickname: '라라',
      qos: 'interactive',
      createdAt: '2026-08-31T00:00:00.000Z',
    })
    await store.startCollectionRun({
      runId: run.id,
      total: 1,
      updatedAt: '2026-08-31T00:00:00.000Z',
    })
    const { queue } = fakeQueue()
    const collector = {
      collect: vi.fn(),
      collectTarget: vi.fn(async () => ({
        target: fullCharacterTargets[0],
        report: {
          sectionId: 'characterBasic',
          status: 'failed',
          issueCount: 1,
        },
      })),
    } as unknown as CollectorPort
    const processor = createNexonJobProcessor({ collector, queue, store })

    await processor({
      kind: 'fetch-character-section',
      runId: run.id,
      nickname: '라라',
      ocid: 'ocid-1',
      sectionId: 'characterBasic',
      qos: 'interactive',
    })

    expect(await store.getCollectionRun(run.id)).toMatchObject({
      status: 'failed',
      completed: 1,
      failed: 1,
      partial: 0,
    })
  })

  it('parser partial을 성공이 아닌 부분 성공으로 기록한다', async () => {
    const store = new MemoryDataStore()
    const run = await store.createCollectionRun({
      nickname: '라라',
      qos: 'interactive',
      createdAt: '2026-08-31T00:00:00.000Z',
    })
    await store.startCollectionRun({
      runId: run.id,
      total: 1,
      updatedAt: '2026-08-31T00:00:00.000Z',
    })
    const { queue } = fakeQueue()
    const collector = {
      collect: vi.fn(),
      collectTarget: vi.fn(async () => ({
        target: fullCharacterTargets[0],
        report: {
          sectionId: 'characterBasic',
          status: 'partial',
          issueCount: 1,
        },
      })),
    } as unknown as CollectorPort
    const processor = createNexonJobProcessor({ collector, queue, store })

    await processor({
      kind: 'fetch-character-section',
      runId: run.id,
      nickname: '라라',
      ocid: 'ocid-1',
      sectionId: 'characterBasic',
      qos: 'interactive',
    })

    expect(await store.getCollectionRun(run.id)).toMatchObject({
      status: 'partial',
      completed: 1,
      succeeded: 0,
      partial: 1,
      failed: 0,
    })
  })
})
