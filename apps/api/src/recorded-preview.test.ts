import { beforeAll, describe, expect, it, vi } from 'vitest'

import { createApp } from './app.js'
import { findCharacterView } from './features/character/view.js'
import { createRecordedPreviewData } from './recorded-preview-data.js'

let data: Awaited<ReturnType<typeof createRecordedPreviewData>>
beforeAll(async () => {
  data = await createRecordedPreviewData()
})

const expected = [
  ['빙캔', '제로', 287, 245508787],
  ['소주에보드카', '비숍', 287, 225507058],
  ['섭주', '패스파인더', 289, 236045633],
  ['무들', '패스파인더', 286, 116662877],
  ['버블볍', '플레임위자드', 286, 138972466],
] as const

describe('군장검사 실제 Nexon 응답 재생', () => {
  it.each(expected)(
    '%s의 raw→parser→projection→HTTP 계약을 검증한다',
    async (nickname, job, level, combatPower) => {
      expect(
        data.reports.find((report) => report.nickname === nickname)?.status,
      ).toBe('complete')
      const view = await findCharacterView(data.store, nickname)
      expect(Object.values(view!.sections)).toHaveLength(20)
      for (const section of Object.values(view!.sections)) {
        expect(section).toMatchObject({
          status: 'complete',
          stale: false,
          issues: [],
        })
      }
      expect(view?.sections.basic?.data).toMatchObject({
        nickname,
        class: job,
        level,
      })
      expect(view?.sections.stat?.data?.combatPower).toBe(combatPower)
      expect(
        view?.sections.itemEquipment?.data?.some(
          (preset) => preset.active && preset.itemEquipmentInfo.length > 0,
        ),
      ).toBe(true)
      expect(view?.sections.symbol?.data?.length).toBeGreaterThan(0)
      const app = createApp(data)
      for (const path of ['characters', 'character']) {
        const response = await app.handle(
          new Request(
            `http://localhost/${path}/${encodeURIComponent(nickname)}`,
          ),
        )
        expect(response.status).toBe(200)
        const body = await response.text()
        expect(body).toContain(nickname)
        expect(body).not.toContain('final_stat')
        expect(body).not.toContain('item_equipment_preset_1')
      }
    },
  )

  it('null MP, 비어 있는 펫 슬롯과 미사용 HEXA 프리셋을 값 0이나 전체 오류로 바꾸지 않는다', async () => {
    const zero = await findCharacterView(data.store, '빙캔')
    expect(zero?.sections.stat?.data).not.toHaveProperty('mp')
    const bishop = await findCharacterView(data.store, '소주에보드카')
    expect(
      bishop?.sections.petEquipment?.data?.find((pet) => pet.petNo === 3)
        ?.petInfo.petAutoSkill,
    ).toMatchObject({ skill2: '쓸만한 컴뱃 오더스' })
    expect(
      bishop?.sections.petEquipment?.data?.find((pet) => pet.petNo === 3)
        ?.petInfo.petAutoSkill,
    ).not.toHaveProperty('skill1')
    const pathfinder = await findCharacterView(data.store, '섭주')
    expect(
      pathfinder?.sections.petEquipment?.data?.every(
        (pet) => pet.petInfo.petEquipment === undefined,
      ),
    ).toBe(true)
    expect(
      pathfinder?.sections.hexaStat?.data?.every(
        (stat) => stat.mainStatName !== null,
      ),
    ).toBe(true)
  })

  it('믹끼유의 실제 ID 오류를 재생하고 다른 다섯 캐릭터 자료를 유지한다', async () => {
    expect(
      data.reports.find((report) => report.nickname === '믹끼유'),
    ).toMatchObject({
      status: 'failed',
      sections: [{ upstreamStatus: 400, nexonErrorCode: 'OPENAPI00004' }],
    })
    const app = createApp(data)
    expect(
      (
        await app.handle(
          new Request(
            'http://localhost/characters/' + encodeURIComponent('믹끼유'),
          ),
        )
      ).status,
    ).toBe(404)
    const response = await app.handle(
      new Request(
        'http://localhost/characters/' +
          encodeURIComponent('믹끼유') +
          '/collections',
        { method: 'POST' },
      ),
    )
    expect(response.status).toBe(202)
    const run = (await response.json()) as { id: string }
    await vi.waitFor(async () => {
      expect(await data.store.getCollectionRun(run.id)).toMatchObject({
        status: 'failed',
        message: '기록된 Nexon 조회 실패: HTTP 400 OPENAPI00004',
      })
    })
    expect(await data.store.findCharacterByNickname('믹끼유')).toBeNull()
    for (const [name] of expected)
      expect(await data.store.findCharacterByNickname(name)).not.toBeNull()
  })
})
