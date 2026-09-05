import type { Character } from '~/types/character.type'

export const getMainStatSummary = (
  character?: Character,
): { label: string; value?: number } => {
  if (!character || character.dataState.sections?.stat?.status !== 'complete')
    return { label: '주스탯' }
  if (character.class === '제논')
    return {
      label: 'MIX',
      value:
        (character.stat.str + character.stat.dex + character.stat.luk) * 0.66,
    }
  if (character.class === '데몬어벤져')
    return { label: 'HP', value: character.stat.hp }
  const candidates = [
    ['STR', character.stat.apStr, character.stat.str],
    ['DEX', character.stat.apDex, character.stat.dex],
    ['INT', character.stat.apInt, character.stat.int],
    ['LUK', character.stat.apLuk, character.stat.luk],
  ] as const
  const sorted = [...candidates].sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
  if (!sorted[0]?.[1]) return { label: '주스탯' }
  return { label: sorted[0][0], value: sorted[0][2] }
}
