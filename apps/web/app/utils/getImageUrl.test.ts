import { describe, expect, it } from 'vitest'

import {
  getCharacterImageUrl,
  getLargeCharacterImageUrl,
  getItemImageUrl,
  getSkillImageUrl,
} from './getImageUrl'

describe('Nexon 이미지 URL', () => {
  it.each([
    [
      getCharacterImageUrl,
      'https://open.api.nexon.com/static/maplestory/character/look/appearance?wmotion=W00',
    ],
    [
      getLargeCharacterImageUrl,
      'https://open.api.nexon.com/static/maplestory/character/look/appearance?wmotion=W00',
    ],
    [
      getItemImageUrl,
      'https://open.api.nexon.com/static/maplestory/item/icon/equipment',
    ],
    [
      getSkillImageUrl,
      'https://open.api.nexon.com/static/maplestory/skill/icon/skill',
    ],
  ] as const)(
    'API가 반환한 전체 URL을 중복 조합하지 않는다',
    (resolve, url) => {
      expect(resolve(url)).toBe(url)
      expect(resolve(undefined)).toBe('')
    },
  )
  it('기존 이미지 코드도 지원한다', () => {
    expect(getCharacterImageUrl('legacy')).toBe(
      'https://open.api.nexon.com/static/maplestory/Character/legacy.png',
    )
    expect(getItemImageUrl('equipment')).toBe(
      'https://open.api.nexon.com/static/maplestory/item/icon/equipment',
    )
    expect(getSkillImageUrl('skill')).toBe(
      'https://open.api.nexon.com/static/maplestory/skill/icon/skill',
    )
  })
})
