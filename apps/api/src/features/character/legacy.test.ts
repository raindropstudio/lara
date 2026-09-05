import { describe, expect, it } from 'vitest'

import { toLegacyCharacter } from './legacy.js'
import type { CharacterView, CharacterViewSection } from './view.js'

const completeSection = <T>(data: T): CharacterViewSection<T> => ({
  status: 'complete',
  observedAt: '2026-08-31T00:00:00.000Z',
  parserVersion: 'character-v1',
  issues: [],
  stale: false,
  data,
})

describe('레거시 캐릭터 응답 변환', () => {
  it('endpoint별 skill과 core를 레거시 필드로 합친다', () => {
    const view: CharacterView = {
      ocid: 'ocid-legacy',
      nickname: '호환라라',
      aliases: [],
      updatedAt: '2026-08-31T00:00:00.000Z',
      sections: {
        basic: completeSection({
          ocid: 'ocid-legacy',
          nickname: '호환라라',
          worldName: '스카니아',
          gender: '여',
          class: '라라',
          classLevel: '6',
          level: 300,
          exp: '0',
          expRate: 0,
          imageUrl: 'image-code',
        }),
        skill5: completeSection([{ grade: '5', name: '용맥 분출', level: 30 }]),
        skill6: completeSection([
          { grade: '6', name: '새록새록 꽃누리', level: 30 },
        ]),
        vMatrix: completeSection([
          {
            skillCore: {
              grade: 5,
              coreName: 'V 코어',
              coreType: 'Skill',
              coreSkill: ['용맥 분출'],
            },
            coreLevel: 30,
          },
        ]),
        hexaMatrix: completeSection([
          {
            skillCore: {
              grade: 6,
              coreName: 'HEXA 코어',
              coreType: 'Skill',
              coreSkill: ['새록새록 꽃누리'],
            },
            coreLevel: 30,
          },
        ]),
        union: completeSection(null),
      },
    }

    const result = toLegacyCharacter(view)

    expect(result?.data.skill.map((skill) => skill.name)).toEqual([
      '용맥 분출',
      '새록새록 꽃누리',
    ])
    expect(
      result?.data.skillCore.map((core) => core.skillCore.coreName),
    ).toEqual(['V 코어', 'HEXA 코어'])
    expect(result?.data).not.toHaveProperty('union')
    expect(result?.data).not.toHaveProperty('ocid')
    expect(result?.data).not.toHaveProperty('sections')
  })

  it('기본 정보가 없으면 flat 응답을 만들지 않는다', () => {
    expect(
      toLegacyCharacter({
        ocid: 'ocid-missing-basic',
        nickname: '기본없음',
        aliases: [],
        updatedAt: '2026-08-31T00:00:00.000Z',
        sections: {},
      }),
    ).toBeNull()
  })
})
