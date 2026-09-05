export type AbilityGrade =
  'LEGENDARY' | 'UNIQUE' | 'EPIC' | 'RARE' | 'NORMAL' | 'UNKNOWN'

export interface AbilityOption {
  abilityGrade: AbilityGrade
  abilityNo: number
  abilityValue: string
}

export interface AbilityPreset {
  abilityInfo: AbilityOption[]
  presetNo: number
  active: boolean
}

export interface Ability {
  preset: AbilityPreset[]
  remainFame: number
}
