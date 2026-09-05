import type { CharacterView } from '~/types/api.type'
import type { Character } from '~/types/character.type'

const emptyPropensity = {
  charismaLevel: 0,
  sensibilityLevel: 0,
  insightLevel: 0,
  willingnessLevel: 0,
  handicraftLevel: 0,
  charmLevel: 0,
}

const characterSectionKeys = [
  'basic',
  'popularity',
  'stat',
  'hyperStat',
  'propensity',
  'ability',
  'itemEquipment',
  'cashEquipment',
  'symbol',
  'setEffect',
  'beautyEquipment',
  'androidEquipment',
  'petEquipment',
  'skill5',
  'skill6',
  'linkSkill',
  'vMatrix',
  'hexaMatrix',
  'hexaStat',
  'union',
] as const satisfies readonly (keyof CharacterView['sections'])[]

export const toCharacter = (view: CharacterView): Character => {
  const basic = view.sections.basic?.data
  if (!basic) throw new Error('캐릭터 기본 정보가 없습니다.')

  const ability = view.sections.ability?.data
  const union = view.sections.union?.data
  const sections = characterSectionKeys.map((key) => view.sections[key])

  return {
    dataState: {
      incomplete: sections.filter((section) => section?.status !== 'complete')
        .length,
      stale: sections.filter((section) => section?.stale === true).length,
    },
    nickname: basic.nickname,
    worldName: basic.worldName,
    gender: basic.gender,
    class: basic.class,
    classLevel: basic.classLevel,
    level: basic.level,
    exp: basic.exp,
    expRate: basic.expRate,
    guildName: basic.guildName ?? '',
    imageUrl: basic.imageUrl,
    dateCreate: basic.dateCreate ?? '',
    accessFlag: basic.accessFlag ?? false,
    liberationQuestClear: basic.liberationQuestClear ?? false,
    popularity: view.sections.popularity?.data ?? basic.popularity ?? 0,
    updatedAt: basic.updatedAt ?? view.updatedAt,
    stat: {
      str: 0,
      dex: 0,
      int: 0,
      luk: 0,
      ...view.sections.stat?.data,
    },
    propensity: view.sections.propensity?.data ?? emptyPropensity,
    hyperStatPreset: view.sections.hyperStat?.data ?? [],
    itemEquipmentPreset: view.sections.itemEquipment?.data ?? [],
    cashEquipmentPreset: view.sections.cashEquipment?.data ?? [],
    setEffect: view.sections.setEffect?.data ?? [],
    petEquipment: view.sections.petEquipment?.data ?? [],
    symbol: view.sections.symbol?.data ?? [],
    skill: [
      ...(view.sections.skill5?.data ?? []),
      ...(view.sections.skill6?.data ?? []),
    ],
    skillCore: [
      ...(view.sections.vMatrix?.data ?? []),
      ...(view.sections.hexaMatrix?.data ?? []),
    ],
    linkSkill: view.sections.linkSkill?.data ?? [],
    hexaStat: view.sections.hexaStat?.data ?? [],
    ...(ability ? { ability } : {}),
    ...(union ? { union } : {}),
  }
}
