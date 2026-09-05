import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  NexonClient,
  type NexonTransport,
  type NexonTransportRequest,
  type NexonTransportResult,
} from '@lara/nexon-client'
import {
  CharacterCollector,
  findCharacterTarget,
} from '@lara/character-pipeline'
import { MemoryDataStore } from '@lara/data-store'
import { afterEach, describe, expect, it } from 'vitest'

import { loadFixtureTransport } from './fake-transport.js'
import { parseFixtureManifest } from './manifest.js'
import { parseFixturePlan, type FixturePlan } from './plan.js'
import { recordFixturePlan } from './record.js'
import { scanSecrets, verifyFixtureManifest } from './verify.js'

const syntheticManifest = fileURLToPath(
  new URL('../../../fixtures/nexon/synthetic/manifest.json', import.meta.url),
)

const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((path) => rm(path, { recursive: true, force: true })),
  )
})

describe('synthetic Nexon fixture', () => {
  it('manifest, body hash와 secret을 검증한다', async () => {
    const result = await verifyFixtureManifest(syntheticManifest)
    expect(result.issues).toEqual([])
    expect(result.checkedBodies).toBe(7)
    expect(result.valid).toBe(true)
  })

  it('response의 알 수 없는 필드를 거부한다', async () => {
    const manifest = JSON.parse(await readFile(syntheticManifest, 'utf8'))
    manifest.cases[0].responses[0].credential = 'unexpected'

    expect(() => parseFixtureManifest(manifest)).toThrow(
      'credential는 허용되지 않습니다.',
    )
  })

  it('정상, 부분 오류, invalid JSON body를 byte 그대로 재생한다', async () => {
    const transport = await loadFixtureTransport(syntheticManifest)
    const client = new NexonClient(transport)

    const normalIdentity = await client.request('characterOcid', {
      characterName: 'fixture-normal',
    })
    const normal = await client.request('characterBasic', {
      ocid: 'synthetic-normal',
    })
    expect(normalIdentity).toMatchObject({ kind: 'response', status: 200 })
    expect(normal.kind).toBe('response')
    if (normal.kind === 'response') {
      expect(new TextDecoder().decode(normal.body)).toContain('fixture-normal')
    }

    const partialIdentity = await client.request('characterOcid', {
      characterName: 'fixture-partial',
    })
    const partialSuccess = await client.request('characterBasic', {
      ocid: 'synthetic-partial',
    })
    const partialFailure = await client.request('characterStat', {
      ocid: 'synthetic-partial',
    })
    expect(partialIdentity).toMatchObject({ kind: 'response', status: 200 })
    expect(partialSuccess.kind).toBe('response')
    expect(partialFailure).toMatchObject({
      kind: 'response',
      status: 429,
      nexonErrorCode: 'OPENAPI00007',
    })

    const invalidIdentity = await client.request('characterOcid', {
      characterName: 'fixture-invalid-json',
    })
    const invalid = await client.request('characterAbility', {
      ocid: 'synthetic-invalid-json',
    })
    expect(invalidIdentity).toMatchObject({ kind: 'response', status: 200 })
    expect(invalid.kind).toBe('response')
    if (invalid.kind === 'response') {
      expect(() => JSON.parse(new TextDecoder().decode(invalid.body))).toThrow()
    }
    transport.assertAllConsumed()
  })

  it('fixture를 raw 저장, parser와 projection까지 재생한다', async () => {
    const basic = findCharacterTarget('characterBasic')
    const stat = findCharacterTarget('characterStat')
    const ability = findCharacterTarget('characterAbility')
    if (!basic || !stat || !ability) throw new Error('수집 target이 없습니다.')

    const normalStore = new MemoryDataStore()
    const normalCollector = new CharacterCollector({
      client: new NexonClient(await loadFixtureTransport(syntheticManifest)),
      store: normalStore,
      now: () => new Date('2026-08-31T00:00:00.000Z'),
    })
    const normalReport = await normalCollector.collect('fixture-normal', [
      basic,
    ])
    const normalCharacter =
      await normalStore.findCharacterByNickname('fixture-normal')
    expect(normalReport.status).toBe('complete')
    expect(
      normalCharacter?.sections.characterBasic?.lastKnownGood?.value,
    ).toMatchObject({ nickname: 'fixture-normal', imageUrl: '123' })

    const partialStore = new MemoryDataStore()
    const partialCollector = new CharacterCollector({
      client: new NexonClient(await loadFixtureTransport(syntheticManifest)),
      store: partialStore,
      now: () => new Date('2026-08-31T00:00:00.000Z'),
    })
    const partialReport = await partialCollector.collect('fixture-partial', [
      basic,
      stat,
    ])
    const partialCharacter =
      await partialStore.findCharacterByNickname('fixture-partial')
    expect(partialReport.status).toBe('partial')
    expect(
      partialCharacter?.sections.characterBasic?.lastKnownGood?.value,
    ).toMatchObject({ nickname: 'fixture-partial', imageUrl: '456' })
    expect(
      partialCharacter?.sections.characterStat?.currentAttempt,
    ).toMatchObject({ status: 'unavailable' })

    const invalidStore = new MemoryDataStore()
    const invalidCollector = new CharacterCollector({
      client: new NexonClient(await loadFixtureTransport(syntheticManifest)),
      store: invalidStore,
      now: () => new Date('2026-08-31T00:00:00.000Z'),
    })
    const invalidReport = await invalidCollector.collect(
      'fixture-invalid-json',
      [ability],
    )
    const invalidCharacter = await invalidStore.findCharacterByNickname(
      'fixture-invalid-json',
    )
    expect(invalidReport.status).toBe('failed')
    expect(
      invalidCharacter?.sections.characterAbility?.currentAttempt,
    ).toMatchObject({ status: 'failed' })
  })

  it('등록되지 않은 요청에서 실제 네트워크로 fallback하지 않는다', async () => {
    const transport = await loadFixtureTransport(syntheticManifest)
    const client = new NexonClient(transport)
    const result = await client.request('characterBasic', {
      ocid: 'not-registered',
    })
    expect(result).toMatchObject({
      kind: 'transport-error',
      code: 'FIXTURE_NOT_FOUND',
    })
  })
})

describe('allowlist plan', () => {
  it('skill grade variant를 허용하고 임의 query를 거부한다', () => {
    const plan = parseFixturePlan({
      schemaVersion: 1,
      cases: [
        {
          id: 'skill-case',
          nickname: 'fixture',
          reason: 'skill grade 구분',
          requests: [
            {
              responseId: 'skill-6',
              endpointId: 'characterSkill',
              params: { skillGrade: '6' },
            },
          ],
        },
      ],
    })
    expect(plan.cases[0]?.requests[0]).toMatchObject({
      endpointId: 'characterSkill',
      params: { skillGrade: '6' },
    })

    expect(() =>
      parseFixturePlan({
        schemaVersion: 1,
        cases: [
          {
            id: 'unsafe',
            nickname: 'fixture',
            reason: 'unsafe query',
            requests: [
              {
                responseId: 'unsafe',
                endpointId: 'characterBasic',
                params: { apiKey: 'secret' },
              },
            ],
          },
        ],
      }),
    ).toThrow('허용되지 않습니다')
  })

  it('credential marker와 활성 secret을 탐지한다', () => {
    expect(scanSecrets('{"authorization":"secret"}')).not.toEqual([])
    expect(
      scanSecrets('prefix-live-secret-value', ['live-secret-value']),
    ).not.toEqual([])
  })
})

class RecorderTransport implements NexonTransport {
  active = 0
  maximumActive = 0

  async execute(request: NexonTransportRequest): Promise<NexonTransportResult> {
    this.active += 1
    this.maximumActive = Math.max(this.maximumActive, this.active)
    if (request.endpoint !== 'characterOcid') {
      await new Promise((resolve) => setTimeout(resolve, 10))
    }
    const value =
      request.endpoint === 'characterOcid'
        ? '{"ocid":"recorded-ocid"}\n'
        : `{"endpoint":"${request.endpoint}"}\n`
    this.active -= 1
    return {
      kind: 'response',
      request: {
        endpoint: request.endpoint,
        path: request.path,
        query: request.query,
      },
      latencyMs: 1,
      status: 200,
      ok: true,
      contentType: 'application/json',
      retryAfter: null,
      body: new TextEncoder().encode(value),
      nexonErrorCode: null,
    }
  }
}

describe('fixture recorder', () => {
  it('ID 조회의 HTTP 실패를 보존하고 다음 캐릭터 기록을 계속한다', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'lara-nexon-id-failure-'))
    temporaryDirectories.push(directory)
    const base = new RecorderTransport()
    const transport: NexonTransport = {
      async execute(request) {
        const response = await base.execute(request)
        if (request.query.character_name !== 'missing') return response
        if (response.kind !== 'response') throw new Error('응답이 필요합니다.')
        return {
          ...response,
          status: 400,
          ok: false,
          nexonErrorCode: 'OPENAPI00004',
          body: new TextEncoder().encode('{"error":{"name":"OPENAPI00004"}}'),
        }
      },
    }
    const result = await recordFixturePlan(
      {
        schemaVersion: 1,
        cases: ['missing', 'available'].map((nickname) => ({
          id: nickname,
          nickname,
          reason: '캐릭터별 실패 격리',
          requests: [{ responseId: 'basic', endpointId: 'characterBasic' }],
        })),
      },
      join(directory, 'recorded'),
      new NexonClient(transport),
    )
    const manifest = parseFixtureManifest(
      JSON.parse(await readFile(result.manifestPath, 'utf8')),
    )
    expect(manifest.cases.map((entry) => entry.responses.length)).toEqual([
      1, 2,
    ])
    expect(manifest.cases[0]?.responses[0]).toMatchObject({
      status: 400,
      nexonErrorCode: 'OPENAPI00004',
    })
    expect((await verifyFixtureManifest(result.manifestPath)).valid).toBe(true)
  })

  it('id→ocid 이후 제한 동시성으로 exact body와 hash를 기록한다', async () => {
    const temporaryDirectory = await mkdtemp(
      join(tmpdir(), 'lara-nexon-fixtures-'),
    )
    temporaryDirectories.push(temporaryDirectory)
    const output = join(temporaryDirectory, 'recorded')
    const plan: FixturePlan = {
      schemaVersion: 1,
      cases: [
        {
          id: 'recorded-case',
          nickname: 'fixture',
          reason: 'recorder test',
          requests: [
            { responseId: 'basic', endpointId: 'characterBasic' },
            { responseId: 'stat', endpointId: 'characterStat' },
            {
              responseId: 'skill-6',
              endpointId: 'characterSkill',
              params: { skillGrade: '6' },
            },
          ],
        },
      ],
    }
    const transport = new RecorderTransport()
    const result = await recordFixturePlan(
      plan,
      output,
      new NexonClient(transport),
      { concurrency: 2 },
    )

    expect(result.responseCount).toBe(4)
    expect(transport.maximumActive).toBe(2)
    const verification = await verifyFixtureManifest(result.manifestPath)
    expect(verification.valid).toBe(true)
    const manifestSource = await readFile(result.manifestPath, 'utf8')
    expect(manifestSource).toContain('character_skill_grade')
    expect(manifestSource).not.toContain('x-nxopen-api-key')
  })
})
