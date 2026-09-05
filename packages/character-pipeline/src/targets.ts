import type { CharacterDateEndpointId, SkillGrade } from '@lara/nexon-client'

export type CharacterTarget =
  | {
      endpointId: CharacterDateEndpointId
      sectionId: CharacterDateEndpointId
    }
  | {
      endpointId: 'characterSkill'
      sectionId: 'characterSkill5' | 'characterSkill6'
      skillGrade: Extract<SkillGrade, '5' | '6'>
    }

export const basicCharacterTargets = [
  { endpointId: 'characterBasic', sectionId: 'characterBasic' },
  { endpointId: 'characterPopularity', sectionId: 'characterPopularity' },
  { endpointId: 'characterStat', sectionId: 'characterStat' },
] as const satisfies readonly CharacterTarget[]

export const fullCharacterTargets = [
  ...basicCharacterTargets,
  { endpointId: 'characterHyperStat', sectionId: 'characterHyperStat' },
  { endpointId: 'characterPropensity', sectionId: 'characterPropensity' },
  { endpointId: 'characterAbility', sectionId: 'characterAbility' },
  {
    endpointId: 'characterItemEquipment',
    sectionId: 'characterItemEquipment',
  },
  {
    endpointId: 'characterCashItemEquipment',
    sectionId: 'characterCashItemEquipment',
  },
  {
    endpointId: 'characterSymbolEquipment',
    sectionId: 'characterSymbolEquipment',
  },
  { endpointId: 'characterSetEffect', sectionId: 'characterSetEffect' },
  {
    endpointId: 'characterBeautyEquipment',
    sectionId: 'characterBeautyEquipment',
  },
  {
    endpointId: 'characterAndroidEquipment',
    sectionId: 'characterAndroidEquipment',
  },
  {
    endpointId: 'characterPetEquipment',
    sectionId: 'characterPetEquipment',
  },
  {
    endpointId: 'characterSkill',
    sectionId: 'characterSkill5',
    skillGrade: '5',
  },
  {
    endpointId: 'characterSkill',
    sectionId: 'characterSkill6',
    skillGrade: '6',
  },
  { endpointId: 'characterLinkSkill', sectionId: 'characterLinkSkill' },
  { endpointId: 'characterVMatrix', sectionId: 'characterVMatrix' },
  { endpointId: 'characterHexaMatrix', sectionId: 'characterHexaMatrix' },
  {
    endpointId: 'characterHexaMatrixStat',
    sectionId: 'characterHexaMatrixStat',
  },
  { endpointId: 'userUnion', sectionId: 'userUnion' },
] as const satisfies readonly CharacterTarget[]

export const findCharacterTarget = (sectionId: string) =>
  fullCharacterTargets.find((target) => target.sectionId === sectionId)
