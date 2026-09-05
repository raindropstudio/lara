export const getLargeCharacterImageUrl = (
  characterImageCode: string | undefined,
) => {
  if (!characterImageCode) return ''
  if (/^https?:\/\//.test(characterImageCode)) return characterImageCode
  return (
    'https://open.api.nexon.com/static/maplestory/Character/180/' +
    characterImageCode +
    '.png'
  )
}

export const getCharacterImageUrl = (
  characterImageCode: string | undefined,
) => {
  if (!characterImageCode) return ''
  if (/^https?:\/\//.test(characterImageCode)) return characterImageCode
  return (
    'https://open.api.nexon.com/static/maplestory/Character/' +
    characterImageCode +
    '.png'
  )
}

export const getItemImageUrl = (itemImageCode: string | undefined) => {
  if (!itemImageCode) return ''
  if (/^https?:\/\//.test(itemImageCode)) return itemImageCode
  return (
    'https://open.api.nexon.com/static/maplestory/item/icon/' + itemImageCode
  )
}

export const getSkillImageUrl = (skillImageCode: string | undefined) => {
  if (!skillImageCode) return ''
  if (/^https?:\/\//.test(skillImageCode)) return skillImageCode
  return (
    'https://open.api.nexon.com/static/maplestory/skill/icon/' + skillImageCode
  )
}

export const getSpecialSkillImageUrl = async (specialSkillName: string) => {
  const specialSkillImages: {
    [key: string]: () => Promise<typeof import('*.png')>
  } = {
    견뎌내기: () => import('~/assets/skill/v/resist.png'),
    '견뎌내기 II': () => import('~/assets/skill/v/resist-2.png'),
    '극복하는 경험 I': () =>
      import('~/assets/skill/v/overcoming-experience-1.png'),
    '근성 I': () => import('~/assets/skill/v/tenacity-1.png'),
    '반격 I': () => import('~/assets/skill/v/counterattack-1.png'),
    '방어구 부수기 I': () => import('~/assets/skill/v/destroy-armor-1.png'),
    '치명적인 일격 I': () => import('~/assets/skill/v/fatal-blow-1.png'),
    '한놈만 I': () => import('~/assets/skill/v/beat-one-1.png'),
    '룬의 가호': () => import('~/assets/skill/v/runes-protection.png'),
    '룬의 경험 I': () => import('~/assets/skill/v/runes-experience-1.png'),
    '룬의 폭주': () => import('~/assets/skill/v/frenzy-rune.png'),
    '끊임없는 공격': () => import('~/assets/skill/v/endless-attack.png'),
    '연속된 일격 I': () => import('~/assets/skill/v/combo-kill-1.png'),
    '치명적인 일격 II': () => import('~/assets/skill/v/fatal-blow-2.png'),
    '보스 슬레이어 I': () => import('~/assets/skill/v/boss-slayer-1.png'),
    '운 좋은 회복 I': () => import('~/assets/skill/v/lucky-restoration-1.png'),
    '일격필살 I': () => import('~/assets/skill/v/deathblow-1.png'),
    '방어구 부수기 II': () => import('~/assets/skill/v/destroy-armor-2.png'),
    '보스 슬레이어 II': () => import('~/assets/skill/v/boss-slayer-2.png'),
    '자동회복 I': () => import('~/assets/skill/v/auto-restoration-1.png'),
    '자동회복 II': () => import('~/assets/skill/v/auto-restoration-2.png'),
    '보스 슬레이어 III': () => import('~/assets/skill/v/boss-slayer-3.png'),
    '폭주하는 힘 I': () => import('~/assets/skill/v/frenzy-power-1.png'),
    '컴 백 I': () => import('~/assets/skill/v/comeback-1.png'),
    '컴 백 II': () => import('~/assets/skill/v/comeback-2.png'),
  }

  if (!specialSkillImages[specialSkillName]) return ''

  const image = await specialSkillImages[specialSkillName]()
  return image.default
}

export const getSymbolImageUrl = async (symbolName: string | undefined) => {
  if (!symbolName) return ''

  const symbolImages: { [key: string]: () => Promise<typeof import('*.png')> } =
    {
      아케인심볼: () => import('~/assets/symbol/arc.png'),
      '아케인심볼 : 소멸의 여로': () => import('~/assets/symbol/arc-1.png'),
      '아케인심볼 : 츄츄 아일랜드': () => import('~/assets/symbol/arc-2.png'),
      '아케인심볼 : 레헬른': () => import('~/assets/symbol/arc-3.png'),
      '아케인심볼 : 아르카나': () => import('~/assets/symbol/arc-4.png'),
      '아케인심볼 : 모라스': () => import('~/assets/symbol/arc-5.png'),
      '아케인심볼 : 에스페라': () => import('~/assets/symbol/arc-6.png'),
      '어센틱심볼 : 세르니움': () => import('~/assets/symbol/aut-1.png'),
      '어센틱심볼 : 아르크스': () => import('~/assets/symbol/aut-2.png'),
      '어센틱심볼 : 오디움': () => import('~/assets/symbol/aut-3.png'),
      '어센틱심볼 : 도원경': () => import('~/assets/symbol/aut-4.png'),
      '어센틱심볼 : 아르테리아': () => import('~/assets/symbol/aut-5.png'),
      '어센틱심볼 : 카르시온': () => import('~/assets/symbol/aut-6.png'),
      '그랜드 어센틱심볼 : 탈라하트': () =>
        import('~/assets/symbol/grandaut-1.png'),
    }

  if (!symbolImages[symbolName]) return ''

  const image = await symbolImages[symbolName]()
  return image.default
}

export const getHexaStatImageUrl = async (hexaStatName: string | undefined) => {
  if (!hexaStatName) return ''
  const hexaStatImages: {
    [key: string]: () => Promise<typeof import('*.png')>
  } = {
    1: () => import('~/assets/hexastat/hexastat-1.png'),
    2: () => import('~/assets/hexastat/hexastat-2.png'),
    3: () => import('~/assets/hexastat/hexastat-3.png'),
  }

  if (!hexaStatImages[hexaStatName]) return ''

  const image = await hexaStatImages[hexaStatName]()
  return image.default
}
