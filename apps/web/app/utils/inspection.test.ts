import { testCharacter } from '../../test/character'
import { describe, expect, it } from 'vitest'
import {
  comparisonMaximum,
  inspectionNotices,
  shouldRefreshInspection,
  inspectionMainStat,
  formatInspectionNumber,
  parseInspectionNames,
} from './inspection'

describe('군장검사 입력과 비교', () => {
  it('쉼표, 줄바꿈, 공백과 중복 이름을 정리한다', () => {
    expect(parseInspectionNames(' 라라, 비숍\n라라  섭주，제로 ')).toEqual([
      '라라',
      '비숍',
      '섭주',
      '제로',
    ])
    expect(parseInspectionNames(' , ')).toEqual([])
  })
  it('누락과 0을 구분하고 유효한 비교 대상이 둘 이상일 때만 최고값을 고른다', () => {
    expect(formatInspectionNumber(undefined)).toBe('—')
    expect(formatInspectionNumber(0, '%')).toBe('0%')
    expect(comparisonMaximum([undefined, 0])).toBeUndefined()
    expect(comparisonMaximum([0, 120, undefined, NaN])).toBe(120)
  })
})

it('KST 날짜 경계에서 이전 자료만 자동 갱신한다', () => {
  const now = Date.parse('2026-09-05T15:01:00Z')
  expect(shouldRefreshInspection('2026-09-05T14:59:00Z', now)).toBe(true)
  expect(shouldRefreshInspection('2026-09-05T15:00:00Z', now)).toBe(false)
})
it('부분 응답에는 시드링 누락 판정을 하지 않고 확인된 만료만 안내한다', () => {
  const character = testCharacter()
  character.guildName = '길드'
  expect(inspectionNotices(character)).toEqual([])
  character.dataState.sections = {
    itemEquipment: { status: 'complete', stale: false },
  }
  expect(inspectionNotices(character)[0]?.label).toContain('시드링')
  character.itemEquipmentPreset = [
    {
      presetNo: 1,
      active: true,
      itemEquipmentInfo: [
        {
          part: '칭호',
          slot: '칭호',
          name: '칭호',
          dateOptionExpire: '2020-01-01T00:00:00Z',
        },
      ],
    },
  ]
  expect(
    inspectionNotices(character).some(
      (notice) => notice.label === '칭호 기간 만료',
    ),
  ).toBe(true)
  expect(inspectionMainStat(character).value).toBeUndefined()
})
