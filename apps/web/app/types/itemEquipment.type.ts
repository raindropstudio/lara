export interface ItemOption {
  str?: number
  dex?: number
  int?: number
  luk?: number
  maxHp?: number
  maxMp?: number
  attackPower?: number
  magicPower?: number
  armor?: number
  speed?: number
  jump?: number
  bossDamage?: number
  ignoreMonsterArmor?: number
  allStat?: number
  damage?: number
  equipmentLevelDecrease?: number
  maxHpRate?: number
  maxMpRate?: number
  baseEquipmentLevel?: number
  exceptionalUpgrade?: number
}

export interface ItemEquipmentInfo {
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
  potentialOption?: string[]
  additionalPotentialOption?: string[]
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
  coloringPrismRange?: string
  coloringPrismHue?: number
  coloringPrismSaturation?: number
  coloringPrismValue?: number
}

export interface ItemEquipmentPreset {
  itemEquipmentInfo: ItemEquipmentInfo[]
  presetNo: number
  active: boolean
}
