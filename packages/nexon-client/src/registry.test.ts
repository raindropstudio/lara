import { describe, expect, it } from 'vitest'

import { legacyEndpointRegistry, type LegacyEndpointId } from './registry.js'

describe('레거시 endpoint registry', () => {
  it('레거시 경로 21개를 중복 없이 등록한다', () => {
    const entries = Object.entries(legacyEndpointRegistry)
    expect(entries).toHaveLength(21)
    expect(new Set(entries.map(([, endpoint]) => endpoint.path)).size).toBe(21)
  })

  it('skill grade를 Nexon query 이름으로 변환한다', () => {
    expect(
      legacyEndpointRegistry.characterSkill.buildQuery({
        ocid: 'ocid-1',
        date: '2026-08-30',
        skillGrade: '6',
      }),
    ).toEqual({
      ocid: 'ocid-1',
      date: '2026-08-30',
      character_skill_grade: '6',
    })
  })

  it('registry key와 endpoint id 타입이 일치한다', () => {
    const ids = Object.keys(legacyEndpointRegistry) as LegacyEndpointId[]
    expect(ids).toContain('characterHexaMatrixStat')
    expect(ids).toContain('unionRanking')
  })
})
