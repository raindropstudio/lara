import { randomUUID } from 'node:crypto'
import { MongoClient } from 'mongodb'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { MongoDataStore } from './mongo.js'

const describeMongo =
  process.env.RUN_MONGO_TESTS === '1' ? describe : describe.skip

describeMongo('Mongo data store', () => {
  const uri = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017'
  const databaseName = `lara_test_${randomUUID().replaceAll('-', '')}`
  const client = new MongoClient(uri)
  const store = new MongoDataStore({ client, databaseName })

  beforeAll(async () => {
    await client.connect()
    await store.ensureIndexes()
  })

  afterAll(async () => {
    await client.db(databaseName).dropDatabase()
    await client.close()
  })

  it('원본 중복 제거와 last-known-good 갱신을 보존한다', async () => {
    const body = new TextEncoder().encode('{"character_name":"라라"}')
    const fetch = await store.saveFetch({
      endpointId: 'characterBasic',
      path: '/character/basic',
      query: { ocid: 'ocid-1' },
      fetchedAt: '2026-08-31T00:00:00.000Z',
      latencyMs: 1,
      outcome: 'response',
      status: 200,
      body,
    })
    await store.upsertCharacterIdentity({
      ocid: 'ocid-1',
      nickname: '라라',
      observedAt: fetch.fetchedAt,
    })
    const parse = await store.saveParseRun({
      fetchId: fetch.id,
      endpointId: fetch.endpointId,
      parserVersion: 'v1',
      status: 'complete',
      parsedAt: fetch.fetchedAt,
      issues: [],
      unknownPaths: [],
      value: { nickname: '라라' },
    })
    if (!parse.valueHash) throw new Error('value hash가 필요합니다.')
    await store.updateCharacterSection({
      ocid: 'ocid-1',
      endpointId: fetch.endpointId,
      attempt: {
        fetchId: fetch.id,
        parseRunId: parse.id,
        status: 'complete',
        observedAt: fetch.fetchedAt,
        parserVersion: parse.parserVersion,
        issues: [],
      },
      value: parse.value,
      valueHash: parse.valueHash,
    })

    expect((await store.getRawPayload(fetch.rawHash ?? ''))?.body).toEqual(body)
    expect(
      (await store.findCharacterByNickname('라라'))?.sections.characterBasic
        ?.lastKnownGood?.value,
    ).toEqual({ nickname: '라라' })
  })

  it('늦게 도착한 identity와 section이 최신 projection을 되돌리지 않는다', async () => {
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

  it('동시에 생성한 같은 닉네임의 활성 수집 run을 하나로 합친다', async () => {
    const [first, duplicate] = await Promise.all([
      store.createCollectionRun({
        nickname: '중복방지',
        qos: 'interactive',
        createdAt: '2026-08-31T00:00:00.000Z',
      }),
      store.createCollectionRun({
        nickname: '중복방지',
        qos: 'interactive',
        createdAt: '2026-08-31T00:00:01.000Z',
      }),
    ])
    expect(duplicate.id).toBe(first.id)

    await store.failCollectionRun({
      runId: first.id,
      stepId: 'test',
      updatedAt: '2026-08-31T00:00:02.000Z',
      message: '테스트 종료',
    })
    const next = await store.createCollectionRun({
      nickname: '중복방지',
      qos: 'interactive',
      createdAt: '2026-08-31T00:00:03.000Z',
    })
    expect(next.id).not.toBe(first.id)
  })

  it('terminal 상태와 치명 오류 완료 보정을 원자적으로 기록한다', async () => {
    const completedRun = await store.createCollectionRun({
      nickname: '완료',
      qos: 'interactive',
      createdAt: '2026-08-31T00:00:00.000Z',
    })
    await store.startCollectionRun({
      runId: completedRun.id,
      total: 1,
      updatedAt: '2026-08-31T00:00:01.000Z',
    })
    const completed = await store.recordCollectionStep({
      runId: completedRun.id,
      stepId: 'only-step',
      outcome: 'succeeded',
      updatedAt: '2026-08-31T00:00:02.000Z',
    })
    expect(completed).toMatchObject({
      status: 'completed',
      succeeded: 1,
      partial: 0,
      failed: 0,
      sequence: 2,
    })
    expect(
      await store.startCollectionRun({
        runId: completedRun.id,
        total: 10,
        updatedAt: '2026-08-31T00:00:03.000Z',
      }),
    ).toEqual(completed)
    expect(
      await store.recordCollectionStep({
        runId: completedRun.id,
        stepId: 'late-step',
        outcome: 'failed',
        updatedAt: '2026-08-31T00:00:04.000Z',
      }),
    ).toEqual(completed)

    const failedRun = await store.createCollectionRun({
      nickname: '실패',
      qos: 'interactive',
      createdAt: '2026-08-31T00:00:00.000Z',
    })
    await store.startCollectionRun({
      runId: failedRun.id,
      total: 2,
      updatedAt: '2026-08-31T00:00:01.000Z',
    })
    await store.recordCollectionStep({
      runId: failedRun.id,
      stepId: 'characterBasic',
      outcome: 'succeeded',
      updatedAt: '2026-08-31T00:00:02.000Z',
    })
    const failed = await store.failCollectionRun({
      runId: failedRun.id,
      stepId: 'characterBasic',
      updatedAt: '2026-08-31T00:00:03.000Z',
      message: '하위 작업 생성 실패',
    })
    const duplicate = await store.failCollectionRun({
      runId: failedRun.id,
      stepId: 'characterBasic',
      updatedAt: '2026-08-31T00:00:04.000Z',
      message: '중복 실패',
    })
    expect(failed).toMatchObject({
      status: 'partial',
      completed: 2,
      succeeded: 1,
      partial: 0,
      failed: 1,
      message: '하위 작업 생성 실패',
    })
    expect(duplicate).toEqual(failed)

    const onlyFailedRun = await store.createCollectionRun({
      nickname: '없는이름',
      qos: 'interactive',
      createdAt: '2026-08-31T00:00:00.000Z',
    })
    await store.startCollectionRun({
      runId: onlyFailedRun.id,
      total: 2,
      updatedAt: '2026-08-31T00:00:01.000Z',
    })
    const onlyFailed = await store.failCollectionRun({
      runId: onlyFailedRun.id,
      stepId: 'resolve-character',
      updatedAt: '2026-08-31T00:00:02.000Z',
      message: 'OCID 확인 실패',
    })
    expect(onlyFailed).toMatchObject({
      status: 'failed',
      completed: 2,
      succeeded: 0,
      partial: 0,
      failed: 1,
    })
  })

  it('parser partial만 있어도 partial로 종료한다', async () => {
    const run = await store.createCollectionRun({
      nickname: '부분성공',
      qos: 'interactive',
      createdAt: '2026-08-31T00:00:00.000Z',
    })
    await store.startCollectionRun({
      runId: run.id,
      total: 1,
      updatedAt: '2026-08-31T00:00:01.000Z',
    })
    const partial = await store.recordCollectionStep({
      runId: run.id,
      stepId: 'characterBasic',
      outcome: 'partial',
      updatedAt: '2026-08-31T00:00:02.000Z',
    })

    expect(partial).toMatchObject({
      status: 'partial',
      completed: 1,
      succeeded: 0,
      partial: 1,
      failed: 0,
    })
  })

  it('복구할 오래된 queued run만 조회한다', async () => {
    const oldest = await store.createCollectionRun({
      nickname: '오래된대기',
      qos: 'interactive',
      createdAt: '2026-08-31T01:00:00.000Z',
    })
    const running = await store.createCollectionRun({
      nickname: '실행중',
      qos: 'daily-top',
      createdAt: '2026-08-31T01:00:01.000Z',
    })
    await store.startCollectionRun({
      runId: running.id,
      total: 1,
      updatedAt: '2026-08-31T01:00:02.000Z',
    })
    await store.createCollectionRun({
      nickname: '새대기',
      qos: 'repair',
      createdAt: '2026-08-31T01:01:00.000Z',
    })

    const queued = await store.findQueuedCollectionRuns({
      updatedBefore: '2026-08-31T01:00:30.000Z',
      limit: 10,
    })

    expect(queued.map(({ id }) => id)).toContain(oldest.id)
    expect(queued.map(({ id }) => id)).not.toContain(running.id)

    const marked = await store.recordCollectionDispatchAttempt({
      runId: oldest.id,
      expectedUpdatedAt: oldest.updatedAt,
      attemptedAt: '2026-08-31T01:02:00.000Z',
    })
    expect(marked).toMatchObject({
      status: 'queued',
      sequence: 1,
      updatedAt: '2026-08-31T01:02:00.000Z',
    })
  })
})
