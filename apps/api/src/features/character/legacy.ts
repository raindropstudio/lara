import type { legacyCharacterSchema } from './schema.js'
import type { CharacterView } from './view.js'

export type LegacyCharacter = typeof legacyCharacterSchema.static

const emptyPropensity: LegacyCharacter['propensity'] = {
  charismaLevel: 0,
  sensibilityLevel: 0,
  insightLevel: 0,
  willingnessLevel: 0,
  handicraftLevel: 0,
  charmLevel: 0,
}

const legacySectionKeys = [
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
  'petEquipment',
  'skill5',
  'skill6',
  'linkSkill',
  'vMatrix',
  'hexaMatrix',
  'hexaStat',
  'union',
] as const satisfies ReadonlyArray<keyof CharacterView['sections']>

export type LegacyCharacterProjection = {
  data: LegacyCharacter
  incompleteSections: number
  staleSections: number
}

export const toLegacyCharacter = (
  view: CharacterView,
): LegacyCharacterProjection | null => {
  const basic = view.sections.basic?.data
  if (!basic) return null

  const ability = view.sections.ability?.data
  const union = view.sections.union?.data
  const sections = legacySectionKeys.map((key) => view.sections[key])

  return {
    data: {
      nickname: basic.nickname,
      worldName: basic.worldName,
      gender: basic.gender,
      class: basic.class,
      classLevel: basic.classLevel,
      level: basic.level,
      exp: basic.exp,
      expRate: basic.expRate,
      ...(basic.guildName === undefined ? {} : { guildName: basic.guildName }),
      imageUrl: basic.imageUrl,
      ...(basic.dateCreate === undefined
        ? {}
        : { dateCreate: basic.dateCreate }),
      ...(basic.accessFlag === undefined
        ? {}
        : { accessFlag: basic.accessFlag }),
      liberationQuestClear: basic.liberationQuestClear ?? false,
      popularity: view.sections.popularity?.data ?? basic.popularity ?? 0,
      updatedAt: basic.updatedAt ?? view.updatedAt,
      stat: view.sections.stat?.data ?? {},
      hyperStatPreset: view.sections.hyperStat?.data ?? [],
      propensity: view.sections.propensity?.data ?? emptyPropensity,
      ...(ability === undefined ? {} : { ability }),
      itemEquipmentPreset: view.sections.itemEquipment?.data ?? [],
      cashEquipmentPreset: view.sections.cashEquipment?.data ?? [],
      ...(union === undefined || union === null ? {} : { union }),
      setEffect: view.sections.setEffect?.data ?? [],
      petEquipment: view.sections.petEquipment?.data ?? [],
      symbol: view.sections.symbol?.data ?? [],
      skill: [
        ...(view.sections.skill5?.data ?? []),
        ...(view.sections.skill6?.data ?? []),
      ],
      linkSkill: view.sections.linkSkill?.data ?? [],
      skillCore: [
        ...(view.sections.vMatrix?.data ?? []),
        ...(view.sections.hexaMatrix?.data ?? []),
      ],
      hexaStat: view.sections.hexaStat?.data ?? [],
    },
    incompleteSections: sections.filter(
      (section) => section?.status !== 'complete',
    ).length,
    staleSections: sections.filter((section) => section?.stale === true).length,
  }
}
