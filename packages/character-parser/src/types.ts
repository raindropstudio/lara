export type CharacterBasic = {
  ocid: string
  nickname: string
  worldName: string
  gender: string
  class: string
  classLevel: string
  level: number
  exp: string
  expRate: number
  guildName?: string
  imageUrl: string
  dateCreate?: string
  accessFlag?: boolean
  liberationQuestClear?: boolean
  popularity?: number
  updatedAt?: string
}

export type Stat = Partial<
  Record<
    | 'maxStatAttackPower'
    | 'minStatAttackPower'
    | 'damage'
    | 'bossMonsterDamage'
    | 'finalDamage'
    | 'ignoreDefenseRate'
    | 'criticalRate'
    | 'criticalDamage'
    | 'abnormalStatusResistance'
    | 'stance'
    | 'defense'
    | 'moveSpeed'
    | 'jumpPower'
    | 'starForce'
    | 'arcaneForce'
    | 'authenticForce'
    | 'str'
    | 'dex'
    | 'int'
    | 'luk'
    | 'hp'
    | 'mp'
    | 'apStr'
    | 'apDex'
    | 'apInt'
    | 'apLuk'
    | 'apHp'
    | 'apMp'
    | 'itemDropRate'
    | 'mesoAcquisition'
    | 'buffDuration'
    | 'attackSpeed'
    | 'normalMonsterDamage'
    | 'cooldownReductionPercent'
    | 'cooldownReductionSeconds'
    | 'cooldownExemption'
    | 'ignoreAttributeResistance'
    | 'abnormalStatusAdditionalDamage'
    | 'weaponMastery'
    | 'additionalExp'
    | 'attackPower'
    | 'magicPower'
    | 'combatPower'
    | 'summonDurationIncrease'
    | 'remainAp',
    number
  >
>

export type HyperStatOption = {
  statType: string
  statPoint: number
  statLevel: number
  statIncrease: string
}

export type HyperStatPreset = {
  hyperStatInfo: HyperStatOption[]
  presetNo: number
  active: boolean
  remainPoint: number
}

export type Propensity = {
  charismaLevel: number
  sensibilityLevel: number
  insightLevel: number
  willingnessLevel: number
  handicraftLevel: number
  charmLevel: number
}

export type AbilityGrade =
  'LEGENDARY' | 'UNIQUE' | 'EPIC' | 'RARE' | 'NORMAL' | 'UNKNOWN'

export type Ability = {
  preset: Array<{
    abilityInfo: Array<{
      abilityGrade: AbilityGrade
      abilityNo: number
      abilityValue: string
    }>
    presetNo: number
    active: boolean
  }>
  remainFame: number
}

export type ItemOption = Partial<
  Record<
    | 'str'
    | 'dex'
    | 'int'
    | 'luk'
    | 'maxHp'
    | 'maxMp'
    | 'attackPower'
    | 'magicPower'
    | 'armor'
    | 'speed'
    | 'jump'
    | 'bossDamage'
    | 'ignoreMonsterArmor'
    | 'allStat'
    | 'damage'
    | 'equipmentLevelDecrease'
    | 'maxHpRate'
    | 'maxMpRate'
    | 'baseEquipmentLevel'
    | 'exceptionalUpgrade',
    number
  >
>

export type ItemEquipmentInfo = {
  part: string
  slot: string
  name: string
  icon?: string
  description?: string
  shapeName?: string
  shapeIcon?: string
  gender?: string
  potentialOptionGrade?: string
  additionalPotentialOptionGrade?: string
  potentialOption: string[]
  additionalPotentialOption: string[]
  equipmentLevelIncrease?: number
  growthExp?: number
  growthLevel?: number
  scrollUpgrade?: number
  cuttableCount?: number
  goldenHammerFlag?: boolean
  scrollResilienceCount?: number
  scrollUpgradeableCount?: number
  soulName?: string
  soulOption?: string
  starforce?: number
  starforceScrollFlag?: boolean
  specialRingLevel?: number
  dateExpire?: string
  dateOptionExpire?: string
  totalOption?: ItemOption
  baseOption?: ItemOption
  exceptionalOption?: ItemOption
  addOption?: ItemOption
  etcOption?: ItemOption
  starforceOption?: ItemOption
}

export type ItemEquipmentPreset = {
  itemEquipmentInfo: ItemEquipmentInfo[]
  presetNo: number
  active: boolean
}

export type CashEquipmentPreset = {
  presetNo: number
  active: boolean
  cashEquipmentInfo: Array<{
    part: string
    slot: string
    name: string
    icon?: string
    description?: string
    dateExpire?: string
    dateOptionExpire?: string
    label?: string
    itemGender?: string
    option?: ItemOption
    coloringPrismRange?: string
    coloringPrismHue?: number
    coloringPrismSaturation?: number
    coloringPrismValue?: number
  }>
}

export type SymbolInfo = {
  name: string
  force: number
  level: number
  str: number
  dex: number
  int: number
  luk: number
  hp: number
  dropRate: number
  mesoRate: number
  expRate: number
  growthCount: number
  requireGrowthCount: number
}

export type SetEffect = {
  setName: string
  setOptionList: Array<{ setCount: number; setOption: string }>
  setCount: number
}

export type PetEquipment = {
  petNo: number
  petInfo: {
    petName: string
    petNickname: string
    petIcon?: string
    petDescription: string
    petType?: string
    petSkills: string[]
    petDateExpire?: string
    petAppearance?: string
    petAppearanceIcon?: string
    petEquipment?: {
      itemName: string
      itemIcon?: string
      itemDescription?: string
      scrollUpgrade?: number
      scrollUpgradable?: number
      itemShape?: string
      itemShapeIcon?: string
      attackPower?: number
      magicPower?: number
    }
    petAutoSkill?: {
      skill1: string
      skill1Icon?: string
      skill2?: string
      skill2Icon?: string
    }
  }
}

export type Skill = {
  grade: string
  name: string
  description?: string
  level: number
  icon?: string
  effect?: string
  effectNext?: string
}

export type LinkSkill = {
  ownedSkill?: Skill
  skill: Skill[]
  presetNo: number
}

export type SkillCore = {
  skillCore: {
    grade: number
    coreName: string
    coreType: string
    coreSkill: string[]
  }
  slotId?: number
  slotLevel?: number
  coreLevel: number
}

export type HexaStat = {
  hexaStatNo: number
  presetNo: number
  active: boolean
  mainStatName: string
  mainStatLevel: number
  subStat1Name: string
  subStat1Level: number
  subStat2Name: string
  subStat2Level: number
  statGrade: number
}

export type Union = {
  unionLevel: number
  unionArtifactLevel: number
  unionArtifactExp: number
  unionArtifactPoint: number
}
