export type MainStat = 'str' | 'dex' | 'int' | 'luk' | 'mix' | 'hp'

export const findMainStat = (character?: Character) => {
  if (!character || !character?.stat) return null

  // 직업명으로 추정
  if (character.class === '제논') return 'mix'
  if (character.class === '데몬어벤져') return 'hp'

  // AP를 투자한 스탯 기준으로 주스탯 추정
  const stat = {
    str: character.stat.apStr || 0,
    dex: character.stat.apDex || 0,
    int: character.stat.apInt || 0,
    luk: character.stat.apLuk || 0,
  }

  return (Object.keys(stat) as (keyof typeof stat)[]).reduce((a, b) =>
    stat[a] > stat[b] ? a : b,
  )
}
