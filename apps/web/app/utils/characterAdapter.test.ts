import { describe, expect, it } from 'vitest'

import type { CharacterView } from '~/types/api.type'
import { toCharacter } from './characterAdapter'

const baseView = {
  ocid: 'ocid-1',
  nickname: '라라',
  aliases: [],
  updatedAt: '2026-08-31T00:00:00.000Z',
  sections: {
    basic: {
      status: 'partial',
      observedAt: '2026-08-31T00:00:00.000Z',
      parserVersion: 'character-v1',
      issues: [],
      stale: false,
      data: {
        ocid: 'ocid-1',
        nickname: '라라',
        worldName: '스카니아',
        gender: '여',
        class: '라라',
        classLevel: '6',
        level: 290,
        exp: '0',
        expRate: 0,
        imageUrl: 'https://example.test/character.png',
      },
    },
  },
} satisfies CharacterView

describe('toCharacter', () => {
  it('부분 응답의 누락된 영역을 안전한 기본값으로 채운다', () => {
    const character = toCharacter(baseView)

    expect(character.nickname).toBe('라라')
    expect(character.expRate).toBe(0)
    expect(character.dataState).toEqual({ incomplete: 20, stale: 0 })
    expect(character.stat).toMatchObject({ str: 0, dex: 0, int: 0, luk: 0 })
    expect(character.itemEquipmentPreset).toEqual([])
    expect(character.skill).toEqual([])
  })

  it('기본 영역이 없으면 불완전한 화면 모델을 만들지 않는다', () => {
    const view = { ...baseView, sections: {} } satisfies CharacterView

    expect(() => toCharacter(view)).toThrow('캐릭터 기본 정보가 없습니다.')
  })
})
