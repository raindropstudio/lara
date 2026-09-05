import { MemoryDataStore } from '@lara/data-store'
import {
  NexonClient,
  type NexonTransport,
  type NexonTransportRequest,
  type NexonTransportResult,
} from '@lara/nexon-client'
import { describe, expect, it } from 'vitest'

import { CharacterCollector } from './collector.js'
import { basicCharacterTargets } from './targets.js'

const encoder = new TextEncoder()
const response = (
  request: NexonTransportRequest,
  body: unknown,
  status = 200,
): NexonTransportResult => ({
  kind: 'response',
  request,
  latencyMs: 1,
  status,
  ok: status >= 200 && status < 300,
  contentType: 'application/json',
  retryAfter: status === 429 ? '1' : null,
  body: encoder.encode(JSON.stringify(body)),
  nexonErrorCode: status >= 400 ? 'OPENAPI00001' : null,
})

class ScriptedTransport implements NexonTransport {
  constructor(
    private readonly handler: (
      request: NexonTransportRequest,
    ) => NexonTransportResult,
  ) {}

  async execute(request: NexonTransportRequest) {
    return this.handler(request)
  }
}

const basicBody = {
  character_name: '라라',
  world_name: '스카니아',
  character_gender: '여',
  character_class: '라라',
  character_class_level: '6',
  character_level: 300,
  character_exp: '0',
  character_exp_rate: '0',
  character_image: 'https://example.test/item/image-code/avatar.png',
}

describe('Character collector', () => {
  it('endpoint 하나의 실패와 무관하게 성공 section을 저장한다', async () => {
    const store = new MemoryDataStore()
    const client = new NexonClient(
      new ScriptedTransport((request) => {
        switch (request.endpoint) {
          case 'characterOcid':
            return response(request, { ocid: 'ocid-1' })
          case 'characterBasic':
            return response(request, basicBody)
          case 'characterPopularity':
            return response(request, { popularity: 0 })
          case 'characterStat':
            return response(request, { error: { name: 'OPENAPI00001' } }, 500)
          default:
            throw new Error(`예상하지 않은 endpoint: ${request.endpoint}`)
        }
      }),
    )
    const collector = new CharacterCollector({
      client,
      store,
      now: () => new Date('2026-08-31T00:00:00.000Z'),
    })

    const report = await collector.collectBasic('라라')
    const character = await store.findCharacterByNickname('라라')

    expect(report.status).toBe('partial')
    expect(
      character?.sections.characterBasic?.lastKnownGood?.value,
    ).toMatchObject({ nickname: '라라', exp: '0' })
    expect(character?.sections.characterPopularity?.lastKnownGood?.value).toBe(
      0,
    )
    expect(character?.sections.characterStat?.currentAttempt.status).toBe(
      'unavailable',
    )
  })

  it('후속 upstream 실패가 이전 stat 값을 지우지 않는다', async () => {
    const store = new MemoryDataStore()
    let failStat = false
    const client = new NexonClient(
      new ScriptedTransport((request) => {
        if (request.endpoint === 'characterOcid')
          return response(request, { ocid: 'ocid-1' })
        if (request.endpoint === 'characterBasic')
          return response(request, basicBody)
        if (request.endpoint === 'characterPopularity')
          return response(request, { popularity: 1 })
        if (request.endpoint === 'characterStat')
          return failStat
            ? response(request, { error: { name: 'OPENAPI00001' } }, 500)
            : response(request, {
                final_stat: [{ stat_name: 'STR', stat_value: '100' }],
              })
        throw new Error(`예상하지 않은 endpoint: ${request.endpoint}`)
      }),
    )
    const collector = new CharacterCollector({ client, store })
    await collector.collect('라라', basicCharacterTargets)
    failStat = true
    await collector.collect('라라', basicCharacterTargets)

    const stat = (await store.findCharacterByOcid('ocid-1'))?.sections
      .characterStat
    expect(stat?.currentAttempt.status).toBe('unavailable')
    expect(stat?.lastKnownGood?.value).toEqual({ str: 100 })
  })

  it('OCID 오류에서는 상세 endpoint를 호출하지 않는다', async () => {
    const store = new MemoryDataStore()
    let calls = 0
    const client = new NexonClient(
      new ScriptedTransport((request) => {
        calls += 1
        return response(request, { error: { name: 'OPENAPI00003' } }, 400)
      }),
    )
    const collector = new CharacterCollector({ client, store })

    const report = await collector.collectBasic('없는이름')

    expect(report.status).toBe('failed')
    expect(report.sections[0]).toMatchObject({
      sectionId: 'characterOcid',
      status: 'unavailable',
      upstreamStatus: 400,
      nexonErrorCode: 'OPENAPI00001',
    })
    expect(calls).toBe(1)
  })
})
