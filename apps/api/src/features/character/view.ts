import type {
  Ability,
  CashEquipmentPreset,
  CharacterBasic,
  HexaStat,
  HyperStatPreset,
  ItemEquipmentPreset,
  LinkSkill,
  PetEquipment,
  Propensity,
  SetEffect,
  Skill,
  SkillCore,
  Stat,
  SymbolInfo,
  Union,
} from '@lara/character-parser'
import type {
  CharacterCurrent,
  CharacterSection,
  DataStore,
  ParseIssue,
} from '@lara/data-store'

export type CharacterViewSection<T> = {
  status: CharacterSection['currentAttempt']['status']
  observedAt: string
  parserVersion: string
  issues: ParseIssue[]
  stale: boolean
  data?: T
}

export type CharacterView = {
  ocid: string
  nickname: string
  aliases: string[]
  updatedAt: string
  sections: {
    basic?: CharacterViewSection<CharacterBasic>
    popularity?: CharacterViewSection<number>
    stat?: CharacterViewSection<Stat>
    hyperStat?: CharacterViewSection<HyperStatPreset[]>
    propensity?: CharacterViewSection<Propensity>
    ability?: CharacterViewSection<Ability>
    itemEquipment?: CharacterViewSection<ItemEquipmentPreset[]>
    cashEquipment?: CharacterViewSection<CashEquipmentPreset[]>
    symbol?: CharacterViewSection<SymbolInfo[]>
    setEffect?: CharacterViewSection<SetEffect[]>
    beautyEquipment?: CharacterViewSection<Record<string, unknown>>
    androidEquipment?: CharacterViewSection<Record<string, unknown>>
    petEquipment?: CharacterViewSection<PetEquipment[]>
    skill5?: CharacterViewSection<Skill[]>
    skill6?: CharacterViewSection<Skill[]>
    linkSkill?: CharacterViewSection<LinkSkill[]>
    vMatrix?: CharacterViewSection<SkillCore[]>
    hexaMatrix?: CharacterViewSection<SkillCore[]>
    hexaStat?: CharacterViewSection<HexaStat[]>
    union?: CharacterViewSection<Union | null>
  }
}

const viewSection = <T>(
  character: CharacterCurrent,
  key: string,
): CharacterViewSection<T> | undefined => {
  const section = character.sections[key]
  if (!section) return undefined
  const value: CharacterViewSection<T> = {
    status: section.currentAttempt.status,
    observedAt: section.currentAttempt.observedAt,
    parserVersion: section.currentAttempt.parserVersion,
    issues: section.currentAttempt.issues,
    stale:
      section.lastKnownGood !== undefined &&
      section.lastKnownGood.observedAt !== section.currentAttempt.observedAt,
  }
  if (section.lastKnownGood !== undefined)
    value.data = section.lastKnownGood.value as T
  return value
}

export const toCharacterView = (character: CharacterCurrent): CharacterView => {
  const sections: CharacterView['sections'] = {}
  const mappings = {
    basic: 'characterBasic',
    popularity: 'characterPopularity',
    stat: 'characterStat',
    hyperStat: 'characterHyperStat',
    propensity: 'characterPropensity',
    ability: 'characterAbility',
    itemEquipment: 'characterItemEquipment',
    cashEquipment: 'characterCashItemEquipment',
    symbol: 'characterSymbolEquipment',
    setEffect: 'characterSetEffect',
    beautyEquipment: 'characterBeautyEquipment',
    androidEquipment: 'characterAndroidEquipment',
    petEquipment: 'characterPetEquipment',
    skill5: 'characterSkill5',
    skill6: 'characterSkill6',
    linkSkill: 'characterLinkSkill',
    vMatrix: 'characterVMatrix',
    hexaMatrix: 'characterHexaMatrix',
    hexaStat: 'characterHexaMatrixStat',
    union: 'userUnion',
  } as const

  for (const [target, source] of Object.entries(mappings)) {
    const section = viewSection(character, source)
    if (section) {
      ;(sections as Record<string, CharacterViewSection<unknown>>)[target] =
        section
    }
  }

  return {
    ocid: character.ocid,
    nickname: character.nickname,
    aliases: character.aliases,
    updatedAt: character.updatedAt,
    sections,
  }
}

export const findCharacterView = async (
  store: Pick<DataStore, 'findCharacterByNickname'>,
  nickname: string,
) => {
  const character = await store.findCharacterByNickname(nickname)
  return character ? toCharacterView(character) : null
}
