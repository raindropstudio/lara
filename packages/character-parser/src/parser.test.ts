import { describe, expect, it } from 'vitest'

import {
  parseAbility,
  parseBasic,
  parseCashEquipment,
  parseHexaStat,
  parseItemEquipment,
  parsePetEquipment,
  parseStat,
} from './index.js'

const json = (value: unknown) => JSON.stringify(value)

describe('캐릭터 parser', () => {
  it('기본 골격과 숫자 0을 보존한다', () => {
    const result = parseBasic(
      json({
        character_name: '라라',
        world_name: '스카니아',
        character_gender: '여',
        character_class: '라라',
        character_class_level: '6',
        character_level: 300,
        character_exp: '0',
        character_exp_rate: '0',
        character_image:
          'https://open.api.nexon.com/static/maplestory/character/abc/item/123/avatar.png',
        access_flag: 'false',
        liberation_quest_clear_flag: 'true',
      }),
      { ocid: 'ocid-1', popularity: 0 },
    )

    expect(result.status).toBe('complete')
    expect(result.value).toMatchObject({
      ocid: 'ocid-1',
      exp: '0',
      expRate: 0,
      imageUrl: '123',
      accessFlag: false,
      popularity: 0,
    })
  })

  it('필수 골격이 없으면 failed로 구분한다', () => {
    const result = parseBasic(json({ character_name: '라라' }), {
      ocid: 'ocid-1',
    })

    expect(result.status).toBe('failed')
    expect(result.value).toBeUndefined()
    expect(result.issues.some(({ code }) => code === 'missing_required')).toBe(
      true,
    )
  })

  it('알 수 없는 stat만 제외하고 나머지를 반환한다', () => {
    const result = parseStat(
      json({
        final_stat: [
          { stat_name: 'STR', stat_value: '123' },
          { stat_name: '신규 스탯', stat_value: '7' },
          { stat_name: 'DEX', stat_value: 'bad' },
        ],
        remain_ap: 0,
      }),
    )

    expect(result.status).toBe('partial')
    expect(result.value).toEqual({ str: 123, remainAp: 0 })
    expect(result.unknownPaths).toEqual(['$.final_stat[1].stat_name'])
  })

  it('알 수 없는 ability 등급을 표시하고 다른 옵션을 살린다', () => {
    const result = parseAbility(
      json({
        remain_fame: 0,
        preset_no: null,
        ability_info: [
          {
            ability_no: 1,
            ability_grade: '신규',
            ability_value: '공격력 +1',
          },
        ],
      }),
    )

    expect(result.status).toBe('partial')
    expect(result.value?.preset[0]?.abilityInfo[0]?.abilityGrade).toBe(
      'UNKNOWN',
    )
  })

  it('희소 장비 preset과 0 옵션을 안전하게 처리한다', () => {
    const result = parseItemEquipment(
      json({
        preset_no: null,
        item_equipment: [
          {
            item_equipment_part: '무기',
            item_equipment_slot: '무기',
            item_name: '테스트 무기',
            scroll_upgrade: '0',
            starforce: '0',
            item_total_option: { str: '0', dex: '1' },
          },
        ],
        dragon_equipment: null,
        mechanic_equipment: null,
      }),
    )

    expect(result.status).toBe('complete')
    expect(result.value?.[0]).toMatchObject({ presetNo: 1, active: true })
    expect(result.value?.[0]?.itemEquipmentInfo[0]).toMatchObject({
      scrollUpgrade: 0,
      starforce: 0,
      totalOption: { str: 0, dex: 1 },
    })
  })

  it('additional cash preset과 프리즘 0 값을 보존한다', () => {
    const result = parseCashEquipment(
      json({
        preset_no: 1,
        character_look_mode: '1',
        additional_cash_item_equipment_preset_1: [
          {
            cash_item_equipment_part: '모자',
            cash_item_equipment_slot: '모자',
            cash_item_name: '테스트 모자',
            cash_item_coloring_prism: {
              color_range: '전체 색상 계열',
              hue: 0,
              saturation: 0,
              value: 0,
            },
          },
        ],
      }),
    )

    expect(result.value?.[0]).toMatchObject({ presetNo: 5, active: true })
    expect(result.value?.[0]?.cashEquipmentInfo[0]).toMatchObject({
      coloringPrismRange: 'ALL',
      coloringPrismHue: 0,
      coloringPrismSaturation: 0,
      coloringPrismValue: 0,
    })
  })

  it('손상된 펫 하나가 다른 펫을 무효화하지 않는다', () => {
    const result = parsePetEquipment(
      json({
        pet_1_name: '첫째',
        pet_1_nickname: '첫째',
        pet_1_description: '정상',
        pet_1_skill: ['줍기'],
        pet_2_name: '둘째',
        pet_2_nickname: null,
        pet_2_description: '손상',
      }),
    )

    expect(result.status).toBe('partial')
    expect(result.value).toHaveLength(1)
    expect(result.value?.[0]?.petInfo.petName).toBe('첫째')
  })

  it('Hexa core가 없어도 빈 정상 결과를 반환한다', () => {
    const result = parseHexaStat(json({}))

    expect(result.status).toBe('complete')
    expect(result.value).toEqual([])
  })

  it('invalid JSON을 예외 대신 failed로 반환한다', () => {
    const result = parseStat('{')

    expect(result.status).toBe('failed')
    expect(result.issues[0]?.code).toBe('invalid_json')
  })
})

describe('장비 프리셋 복구', () => {
  const weapon = {
    item_equipment_part: '무기',
    item_equipment_slot: '무기',
    item_name: '테스트 무기',
  }
  it('활성 프리셋 본문이 빠져도 현재 착용 장비를 보존하고 부분 응답으로 표시한다', () => {
    const result = parseItemEquipment(
      json({ preset_no: 2, item_equipment: [weapon] }),
    )
    expect(result.status).toBe('partial')
    expect(
      result.value?.find((preset) => preset.active)?.itemEquipmentInfo[0]?.name,
    ).toBe('테스트 무기')
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.item_equipment_preset_2',
          code: 'missing_required',
        }),
      ]),
    )
  })
  it('알 수 없는 프리셋 번호는 보고하고 현재 착용 장비로 복구한다', () => {
    const result = parseItemEquipment(
      json({ preset_no: 99, item_equipment: [weapon] }),
    )
    expect(result.status).toBe('partial')
    expect(result.value?.find((preset) => preset.active)?.presetNo).toBe(1)
    expect(result.value?.[0]?.itemEquipmentInfo).toHaveLength(1)
  })
  it('정상적인 빈 프리셋은 현재 착용 장비로 덮어쓰지 않는다', () => {
    const result = parseItemEquipment(
      json({
        preset_no: 2,
        item_equipment: [weapon],
        item_equipment_preset_2: [],
      }),
    )
    expect(
      result.value?.find((preset) => preset.active)?.itemEquipmentInfo,
    ).toEqual([])
  })
})
