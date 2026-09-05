import { describe, expect, it } from 'vitest'

import { semanticHash } from './hash.js'
import { MemoryDataStore } from './memory.js'

describe('Memory data store', () => {
  it('원본 bytes를 content hash로 보존한다', async () => {
    const store = new MemoryDataStore()
    const body = new TextEncoder().encode('{ "value": 1 }\n')
    const input = {
      endpointId: 'characterBasic',
      path: '/character/basic',
      query: { ocid: 'ocid-1' },
      fetchedAt: '2026-08-31T00:00:00.000Z',
      latencyMs: 10,
      outcome: 'response' as const,
      status: 200,
      contentType: 'application/json',
      body,
    }

    const first = await store.saveFetch(input)
    const second = await store.saveFetch(input)

    expect(second.rawHash).toBe(first.rawHash)
    expect(second.id).not.toBe(first.id)
    const stored = await store.getRawPayload(first.rawHash ?? '')
    expect(stored?.body).toEqual(body)
  })

  it('동일 fetch와 parser version을 멱등 저장한다', async () => {
    const store = new MemoryDataStore()
    const input = {
      fetchId: 'fetch-1',
      endpointId: 'characterBasic',
      parserVersion: 'v1',
      status: 'complete' as const,
      parsedAt: '2026-08-31T00:00:01.000Z',
      issues: [],
      unknownPaths: [],
      value: { nickname: '라라' },
    }

    const first = await store.saveParseRun(input)
    const second = await store.saveParseRun(input)

    expect(second.id).toBe(first.id)
    expect(second.valueHash).toBe(first.valueHash)
  })

  it('현재 실패가 마지막 정상 section을 지우지 않는다', async () => {
    const store = new MemoryDataStore()
    await store.upsertCharacterIdentity({
      ocid: 'ocid-1',
      nickname: '라라',
      observedAt: '2026-08-31T00:00:00.000Z',
    })
    const value = { level: 300 }
    await store.updateCharacterSection({
      ocid: 'ocid-1',
      endpointId: 'characterBasic',
      attempt: {
        fetchId: 'fetch-1',
        parseRunId: 'parse-1',
        status: 'complete',
        observedAt: '2026-08-31T00:00:01.000Z',
        parserVersion: 'v1',
        issues: [],
      },
      value,
      valueHash: semanticHash('characterBasic', 'v1', value),
    })
    await store.updateCharacterSection({
      ocid: 'ocid-1',
      endpointId: 'characterBasic',
      attempt: {
        fetchId: 'fetch-2',
        parseRunId: 'parse-2',
        status: 'failed',
        observedAt: '2026-08-31T00:01:00.000Z',
        parserVersion: 'v2',
        issues: [{ path: '$', code: 'invalid_json', message: '손상됨' }],
      },
    })

    const character = await store.findCharacterByOcid('ocid-1')
    expect(character?.sections.characterBasic?.currentAttempt.status).toBe(
      'failed',
    )
    expect(character?.sections.characterBasic?.lastKnownGood?.value).toEqual(
      value,
    )
  })

  it('닉네임 변경 전 이름도 조회 alias로 보존한다', async () => {
    const store = new MemoryDataStore()
    await store.upsertCharacterIdentity({
      ocid: 'ocid-1',
      nickname: '이전이름',
      observedAt: '2026-08-31T00:00:00.000Z',
    })
    await store.upsertCharacterIdentity({
      ocid: 'ocid-1',
      nickname: '새이름',
      observedAt: '2026-08-31T01:00:00.000Z',
    })

    expect((await store.findCharacterByNickname('이전이름'))?.nickname).toBe(
      '새이름',
    )
  })

  it('늦게 도착한 identity와 section이 최신 projection을 되돌리지 않는다', async () => {
    const store = new MemoryDataStore()
    await store.upsertCharacterIdentity({
      ocid: 'ocid-freshness',
      nickname: '처음이름',
      observedAt: '2026-08-31T00:00:00.000Z',
    })
    await store.upsertCharacterIdentity({
      ocid: 'ocid-freshness',
      nickname: '최신이름',
      observedAt: '2026-08-31T00:02:00.000Z',
    })
    await store.updateCharacterSection({
      ocid: 'ocid-freshness',
      endpointId: 'characterBasic',
      attempt: {
        fetchId: 'fetch-new',
        parseRunId: 'parse-new',
        status: 'complete',
        observedAt: '2026-08-31T00:04:00.000Z',
        parserVersion: 'v2',
        issues: [],
      },
      value: { level: 300 },
      valueHash: 'new-hash',
    })

    await store.upsertCharacterIdentity({
      ocid: 'ocid-freshness',
      nickname: '늦은이름',
      observedAt: '2026-08-31T00:01:00.000Z',
    })
    await store.updateCharacterSection({
      ocid: 'ocid-freshness',
      endpointId: 'characterBasic',
      attempt: {
        fetchId: 'fetch-old',
        parseRunId: 'parse-old',
        status: 'complete',
        observedAt: '2026-08-31T00:03:00.000Z',
        parserVersion: 'v1',
        issues: [],
      },
      value: { level: 100 },
      valueHash: 'old-hash',
    })

    expect(await store.findCharacterByOcid('ocid-freshness')).toMatchObject({
      nickname: '최신이름',
      aliases: ['처음이름'],
      identityObservedAt: '2026-08-31T00:02:00.000Z',
      updatedAt: '2026-08-31T00:04:00.000Z',
      sections: {
        characterBasic: {
          currentAttempt: { fetchId: 'fetch-new' },
          lastKnownGood: { value: { level: 300 } },
        },
      },
    })
  })

  it('같은 닉네임의 활성 수집 run을 재사용한다', async () => {
    const store = new MemoryDataStore()
    const first = await store.createCollectionRun({
      nickname: '라라',
      qos: 'interactive',
      createdAt: '2026-08-31T00:00:00.000Z',
    })
    const duplicate = await store.createCollectionRun({
      nickname: '라라',
      qos: 'interactive',
      createdAt: '2026-08-31T00:00:01.000Z',
    })
    expect(duplicate.id).toBe(first.id)

    await store.failCollectionRun({
      runId: first.id,
      stepId: 'test',
      updatedAt: '2026-08-31T00:00:02.000Z',
      message: '테스트 종료',
    })
    const next = await store.createCollectionRun({
      nickname: '라라',
      qos: 'interactive',
      createdAt: '2026-08-31T00:00:03.000Z',
    })
    expect(next.id).not.toBe(first.id)
  })

  it('객체 key 순서와 무관한 semantic hash를 만든다', () => {
    expect(semanticHash('equipment', 'v1', { b: 2, a: 1 })).toBe(
      semanticHash('equipment', 'v1', { a: 1, b: 2 }),
    )
  })

  it('수집 run 진행률과 부분 성공을 sequence로 기록한다', async () => {
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
    await store.recordCollectionStep({
      runId: run.id,
      stepId: 'basic',
      outcome: 'succeeded',
      updatedAt: '2026-08-31T00:00:02.000Z',
    })
    const completed = await store.recordCollectionStep({
      runId: run.id,
      stepId: 'stat',
      outcome: 'partial',
      updatedAt: '2026-08-31T00:00:03.000Z',
      message: 'stat 일부 파싱',
    })

    expect(completed).toMatchObject({
      status: 'partial',
      total: 2,
      completed: 2,
      succeeded: 1,
      partial: 1,
      failed: 0,
      sequence: 3,
    })

    const duplicate = await store.recordCollectionStep({
      runId: run.id,
      stepId: 'stat',
      outcome: 'partial',
      updatedAt: '2026-08-31T00:00:04.000Z',
    })
    expect(duplicate?.completed).toBe(2)
  })

  it('성공 단계 뒤 치명 오류를 partial로 완료 보정한다', async () => {
    const store = new MemoryDataStore()
    const run = await store.createCollectionRun({
      nickname: '라라',
      qos: 'interactive',
      createdAt: '2026-08-31T00:00:00.000Z',
    })
    await store.startCollectionRun({
      runId: run.id,
      total: 3,
      updatedAt: '2026-08-31T00:00:01.000Z',
    })
    await store.recordCollectionStep({
      runId: run.id,
      stepId: 'basic',
      outcome: 'succeeded',
      updatedAt: '2026-08-31T00:00:02.000Z',
    })

    const failed = await store.failCollectionRun({
      runId: run.id,
      stepId: 'basic',
      updatedAt: '2026-08-31T00:00:03.000Z',
      message: '하위 작업 생성 실패',
    })

    expect(failed).toMatchObject({
      status: 'partial',
      completed: 3,
      succeeded: 1,
      partial: 0,
      failed: 1,
      message: '하위 작업 생성 실패',
    })
  })

  it('보존할 성공 데이터가 없는 치명 오류는 failed로 종료한다', async () => {
    const store = new MemoryDataStore()
    const run = await store.createCollectionRun({
      nickname: '없는이름',
      qos: 'interactive',
      createdAt: '2026-08-31T00:00:00.000Z',
    })
    await store.startCollectionRun({
      runId: run.id,
      total: 3,
      updatedAt: '2026-08-31T00:00:01.000Z',
    })

    const failed = await store.failCollectionRun({
      runId: run.id,
      stepId: 'resolve-character',
      updatedAt: '2026-08-31T00:00:02.000Z',
      message: 'OCID 확인 실패',
    })

    expect(failed).toMatchObject({
      status: 'failed',
      completed: 3,
      succeeded: 0,
      partial: 0,
      failed: 1,
    })
  })

  it('terminal run을 worker 재실행으로 다시 열지 않는다', async () => {
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
    const completed = await store.recordCollectionStep({
      runId: run.id,
      stepId: 'characterBasic',
      outcome: 'succeeded',
      updatedAt: '2026-08-31T00:00:02.000Z',
    })
    const restarted = await store.startCollectionRun({
      runId: run.id,
      total: 20,
      updatedAt: '2026-08-31T00:00:03.000Z',
    })
    const lateStep = await store.recordCollectionStep({
      runId: run.id,
      stepId: 'late-step',
      outcome: 'failed',
      updatedAt: '2026-08-31T00:00:04.000Z',
    })

    expect(restarted).toEqual(completed)
    expect(lateStep).toEqual(completed)
  })

  it('복구할 오래된 queued run만 순서대로 조회한다', async () => {
    const store = new MemoryDataStore()
    const oldest = await store.createCollectionRun({
      nickname: '오래된대기',
      qos: 'interactive',
      createdAt: '2026-08-31T00:00:00.000Z',
    })
    const running = await store.createCollectionRun({
      nickname: '실행중',
      qos: 'daily-top',
      createdAt: '2026-08-31T00:00:01.000Z',
    })
    await store.startCollectionRun({
      runId: running.id,
      total: 1,
      updatedAt: '2026-08-31T00:00:02.000Z',
    })
    await store.createCollectionRun({
      nickname: '새대기',
      qos: 'repair',
      createdAt: '2026-08-31T00:01:00.000Z',
    })

    const queued = await store.findQueuedCollectionRuns({
      updatedBefore: '2026-08-31T00:00:30.000Z',
      limit: 10,
    })

    expect(queued.map(({ id }) => id)).toEqual([oldest.id])
  })
})
