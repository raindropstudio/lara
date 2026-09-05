import { treaty } from '@elysia/eden'
import type {
  Ability,
  HexaStat,
  LinkSkill,
  PetEquipment,
  SetEffect,
  SymbolInfo,
  Union,
} from '@lara/character-parser'
import {
  MemoryDataStore,
  semanticHash,
  type CollectionRun,
} from '@lara/data-store'
import type {
  CollectionQoS,
  CollectionQueue,
  ResolveCharacterJob,
} from '@lara/jobs'
import { describe, expect, expectTypeOf, it } from 'vitest'

import { createApp, parseCorsOrigins } from './app.js'
import type {
  characterViewSchema,
  legacyCharacterSchema,
} from './features/character/schema.js'
import type { LegacyCharacter } from './features/character/legacy.js'
import type { CharacterView } from './features/character/view.js'
import type { collectionRunSchema } from './features/collection/schema.js'

const fakeCollectionQueue = (failure?: Error) => {
  const jobs: ResolveCharacterJob[] = []
  const queue: CollectionQueue = {
    async enqueueCollection(job) {
      jobs.push(structuredClone(job))
      if (failure) throw failure
    },
  }
  return { jobs, queue }
}

const readStreamText = async (response: Response): Promise<string> => {
  const reader = response.body?.getReader()
  if (!reader) return ''
  const decoder = new TextDecoder()
  let result = ''
  while (true) {
    const chunk = await reader.read()
    if (chunk.done) return result
    const value: unknown = chunk.value
    result +=
      typeof value === 'string'
        ? value
        : decoder.decode(value as Uint8Array, { stream: true })
  }
}

describe('Eden API 계약', () => {
  it('캐릭터 schema와 view 타입이 서로 같다', () => {
    expectTypeOf<
      typeof characterViewSchema.static
    >().toEqualTypeOf<CharacterView>()
    expectTypeOf<
      typeof legacyCharacterSchema.static
    >().toEqualTypeOf<LegacyCharacter>()
  })

  it('수집 run schema와 저장 타입이 서로 같다', () => {
    expectTypeOf<
      typeof collectionRunSchema.static
    >().toEqualTypeOf<CollectionRun>()
  })

  it('준비된 API 상태를 타입과 함께 반환한다', async () => {
    const response = await treaty(createApp()).health.ready.get()

    expect(response.error).toBeNull()
    expect(response.data).toEqual({
      service: 'api',
      status: 'ok',
    })
  })

  it('준비되지 않은 상태를 503 오류로 구분한다', async () => {
    const response = await treaty(
      createApp({ checkReadiness: () => false }),
    ).health.ready.get()

    expect(response.data).toBeNull()
    expect(response.error?.status).toBe(503)
    expect(response.error?.value).toEqual({
      code: 'NOT_READY',
      message: 'API 의존성이 준비되지 않았습니다.',
    })
  })

  it('설정한 web origin에만 CORS와 preflight를 허용한다', async () => {
    const origins = parseCorsOrigins(
      ' https://web.example,https://web.example ',
    )
    const app = createApp({ corsOrigins: origins })
    const preflight = await app.handle(
      new Request('http://localhost/health', {
        method: 'OPTIONS',
        headers: {
          origin: 'https://web.example',
          'access-control-request-method': 'GET',
        },
      }),
    )
    expect(preflight.status).toBe(204)
    expect(preflight.headers.get('access-control-allow-origin')).toBe(
      'https://web.example',
    )

    const allowed = await app.handle(
      new Request('http://localhost/health', {
        headers: { origin: 'https://web.example' },
      }),
    )
    expect(allowed.headers.get('access-control-expose-headers')).toContain(
      'x-lara-incomplete-sections',
    )

    const denied = await app.handle(
      new Request('http://localhost/health', {
        headers: { origin: 'https://web.example.attacker.invalid' },
      }),
    )
    expect(denied.status).toBe(200)
    expect(denied.headers.get('access-control-allow-origin')).toBeNull()
  })

  it('캐릭터 section과 마지막 정상 데이터를 반환한다', async () => {
    const store = new MemoryDataStore()
    await store.upsertCharacterIdentity({
      ocid: 'ocid-1',
      nickname: '라라',
      observedAt: '2026-08-31T00:00:00.000Z',
    })
    const basic = {
      ocid: 'ocid-1',
      nickname: '라라',
      worldName: '스카니아',
      gender: '여',
      class: '라라',
      classLevel: '6',
      level: 300,
      exp: '0',
      expRate: 0,
      imageUrl: 'image-code',
    }
    await store.updateCharacterSection({
      ocid: 'ocid-1',
      endpointId: 'characterBasic',
      attempt: {
        fetchId: 'fetch-1',
        parseRunId: 'parse-1',
        status: 'complete',
        observedAt: '2026-08-31T00:00:00.000Z',
        parserVersion: 'character-v1',
        issues: [],
      },
      value: basic,
      valueHash: semanticHash('characterBasic', 'character-v1', basic),
    })

    const response = await treaty(createApp({ store }))
      .characters({
        nickname: '라라',
      })
      .get()

    expect(response.error).toBeNull()
    expect(response.data?.sections.basic?.data).toMatchObject({
      nickname: '라라',
      exp: '0',
    })
    expectTypeOf(response.data?.sections.ability?.data).toEqualTypeOf<
      Ability | undefined
    >()
    expectTypeOf(response.data?.sections.symbol?.data).toEqualTypeOf<
      SymbolInfo[] | undefined
    >()
    expectTypeOf(response.data?.sections.setEffect?.data).toEqualTypeOf<
      SetEffect[] | undefined
    >()
    expectTypeOf(response.data?.sections.petEquipment?.data).toEqualTypeOf<
      PetEquipment[] | undefined
    >()
    expectTypeOf(response.data?.sections.linkSkill?.data).toEqualTypeOf<
      LinkSkill[] | undefined
    >()
    expectTypeOf(response.data?.sections.hexaStat?.data).toEqualTypeOf<
      HexaStat[] | undefined
    >()
    expectTypeOf(response.data?.sections.union?.data).toEqualTypeOf<
      Union | null | undefined
    >()
  })

  it('없는 캐릭터를 404 계약으로 구분한다', async () => {
    const response = await treaty(createApp())
      .characters({
        nickname: '없는이름',
      })
      .get()

    expect(response.error?.status).toBe(404)
    expect(response.error?.value).toEqual({
      code: 'CHARACTER_NOT_FOUND',
      message: '캐릭터를 찾을 수 없습니다.',
    })
  })

  it('레거시 경로는 flat 조회만 제공하고 update query를 무시한다', async () => {
    const store = new MemoryDataStore()
    const { jobs, queue } = fakeCollectionQueue()
    await store.upsertCharacterIdentity({
      ocid: 'ocid-legacy',
      nickname: '호환라라',
      observedAt: '2026-08-31T00:00:00.000Z',
    })
    const basic = {
      ocid: 'ocid-legacy',
      nickname: '호환라라',
      worldName: '스카니아',
      gender: '여',
      class: '라라',
      classLevel: '6',
      level: 300,
      exp: '1',
      expRate: 0.1,
      imageUrl: 'image-code',
    }
    const stat = { str: 100, int: 200 }
    await store.updateCharacterSection({
      ocid: 'ocid-legacy',
      endpointId: 'characterBasic',
      attempt: {
        fetchId: 'fetch-basic',
        parseRunId: 'parse-basic',
        status: 'complete',
        observedAt: '2026-08-31T00:00:00.000Z',
        parserVersion: 'character-v1',
        issues: [],
      },
      value: basic,
      valueHash: semanticHash('characterBasic', 'character-v1', basic),
    })
    await store.updateCharacterSection({
      ocid: 'ocid-legacy',
      endpointId: 'characterStat',
      attempt: {
        fetchId: 'fetch-stat-1',
        parseRunId: 'parse-stat-1',
        status: 'complete',
        observedAt: '2026-08-31T00:00:01.000Z',
        parserVersion: 'character-v1',
        issues: [],
      },
      value: stat,
      valueHash: semanticHash('characterStat', 'character-v1', stat),
    })
    await store.updateCharacterSection({
      ocid: 'ocid-legacy',
      endpointId: 'characterStat',
      attempt: {
        fetchId: 'fetch-stat-2',
        parseRunId: 'parse-stat-2',
        status: 'failed',
        observedAt: '2026-08-31T00:00:02.000Z',
        parserVersion: 'character-v1',
        issues: [
          {
            path: '$.final_stat',
            code: 'TYPE_MISMATCH',
            message: '배열이 아닙니다.',
          },
        ],
      },
    })

    const app = createApp({ store, queue })
    const response = await app.handle(
      new Request(
        'http://localhost/character/%ED%98%B8%ED%99%98%EB%9D%BC%EB%9D%BC?update=true',
      ),
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('x-lara-compatibility')).toBe(
      'legacy-flat-read-only',
    )
    expect(response.headers.get('x-lara-update-ignored')).toBe('true')
    expect(response.headers.get('warning')).toContain(
      'update query is deprecated and ignored',
    )
    expect(Number(response.headers.get('x-lara-incomplete-sections'))).toBe(17)
    expect(response.headers.get('x-lara-stale-sections')).toBe('1')
    const body = await response.json()
    expect(body).toMatchObject({
      nickname: '호환라라',
      worldName: '스카니아',
      popularity: 0,
      stat: { str: 100, int: 200 },
      hyperStatPreset: [],
      itemEquipmentPreset: [],
      cashEquipmentPreset: [],
      skill: [],
      skillCore: [],
    })
    expect(body).not.toHaveProperty('ocid')
    expect(body).not.toHaveProperty('sections')
    expect(jobs).toEqual([])
  })

  it('수집 run을 저장한 뒤 interactive job을 enqueue한다', async () => {
    const store = new MemoryDataStore()
    const { jobs, queue } = fakeCollectionQueue()
    const app = createApp({ store, queue })
    const response = await treaty(app)
      .characters({ nickname: '라라' })
      .collections.post()

    expect(response.status).toBe(202)
    expect(response.error).toBeNull()
    expectTypeOf(response.data?.qos).toEqualTypeOf<CollectionQoS | undefined>()
    if (!response.data) throw new Error('수집 run 응답이 없습니다.')
    const run = response.data
    expect(run).toMatchObject({
      nickname: '라라',
      qos: 'interactive',
      status: 'queued',
      partial: 0,
      sequence: 1,
    })
    expect(jobs).toEqual([
      {
        kind: 'resolve-character',
        runId: run.id,
        nickname: '라라',
        qos: 'interactive',
      },
    ])

    const duplicate = await treaty(app)
      .characters({ nickname: '라라' })
      .collections.post()
    expect(duplicate.data?.id).toBe(run.id)
    expect(jobs).toHaveLength(1)

    const storedResponse = await app.handle(
      new Request(`http://localhost/collection-runs/${run.id}`),
    )
    expect(storedResponse.status).toBe(200)
    expect(await storedResponse.json()).toMatchObject({
      id: run.id,
      nickname: run.nickname,
      qos: run.qos,
      status: run.status,
      sequence: run.sequence,
    })
  })

  it('enqueue 실패를 terminal run과 안전한 503으로 남긴다', async () => {
    const store = new MemoryDataStore()
    const { jobs, queue } = fakeCollectionQueue(
      new Error('redis password=never-expose'),
    )
    const response = await createApp({ store, queue }).handle(
      new Request(
        'http://localhost/characters/%EB%9D%BC%EB%9D%BC/collections',
        { method: 'POST' },
      ),
    )

    expect(response.status).toBe(503)
    const body = await response.json()
    expect(body).toEqual({
      code: 'COLLECTION_QUEUE_UNAVAILABLE',
      message: '수집 queue에 요청을 등록하지 못했습니다.',
    })
    expect(JSON.stringify(body)).not.toContain('never-expose')
    const runId = jobs[0]?.runId
    expect(runId).toBeDefined()
    expect(await store.getCollectionRun(runId as string)).toMatchObject({
      status: 'failed',
      completed: 1,
      partial: 0,
      failed: 1,
      sequence: 1,
      message: '수집 job enqueue 실패',
    })
  })

  it('queue 미구성과 없는 collection run을 명시적 오류로 반환한다', async () => {
    const app = createApp()
    const unavailable = await app.handle(
      new Request(
        'http://localhost/characters/%EB%9D%BC%EB%9D%BC/collections',
        {
          method: 'POST',
        },
      ),
    )
    expect(unavailable.status).toBe(503)
    expect(await unavailable.json()).toEqual({
      code: 'COLLECTION_QUEUE_UNAVAILABLE',
      message: '수집 queue가 구성되지 않았습니다.',
    })

    const missing = await app.handle(
      new Request('http://localhost/collection-runs/missing'),
    )
    expect(missing.status).toBe(404)
    expect(await missing.json()).toEqual({
      code: 'COLLECTION_RUN_NOT_FOUND',
      message: '수집 실행을 찾을 수 없습니다.',
    })
  })

  it('SSE는 cursor 이후 durable snapshot만 보내고 terminal에서 끝난다', async () => {
    const store = new MemoryDataStore()
    const run = await store.createCollectionRun({
      nickname: '라라',
      qos: 'interactive',
      createdAt: '2026-08-31T00:00:00.000Z',
    })
    const app = createApp({ store, collectionEventsPollIntervalMs: 1 })
    const complete = (async () => {
      await new Promise((resolve) => setTimeout(resolve, 10))
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
    })()

    const response = await app.handle(
      new Request(`http://localhost/collection-runs/${run.id}/events?after=0`),
    )
    const source = await readStreamText(response)
    await complete

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/event-stream')
    expect(source).not.toContain('"status":"queued"')
    expect(source).toContain('"status":"completed"')
    const eventIds = [...source.matchAll(/^id: (\d+)$/gm)].map((match) =>
      Number(match[1]),
    )
    expect(eventIds.length).toBeGreaterThan(0)
    expect(eventIds.every((sequence) => sequence > 0)).toBe(true)
    expect(new Set(eventIds).size).toBe(eventIds.length)
  })
})
