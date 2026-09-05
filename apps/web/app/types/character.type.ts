import type { Ability } from './ability.type'
import type { CashEquipmentPreset } from './cashEquipment.type'
import type { HexaStat } from './hexaStat.type'
import type { HyperStatPreset } from './hyperStat'
import type { ItemEquipmentPreset } from './itemEquipment.type'
import type { PetEquipment } from './petEquipment.type'
import type { Propensity } from './propensity.type'
import type { SetEffect } from './setEffect.type'
import type { Stat } from './stat.type'
import type { Symbol } from './symbol.type'
import type { Union } from './union.type'

export interface Character {
  dataState: {
    incomplete: number
    stale: number
  }
  nickname: string
  worldName: string
  gender: string
  class: string
  classLevel: string
  level: number
  exp: string
  expRate: number
  guildName: string
  imageUrl: string
  dateCreate: string
  accessFlag: boolean
  liberationQuestClear: boolean
  popularity: number
  updatedAt: string
  stat: Stat
  propensity: Propensity
  hyperStatPreset?: HyperStatPreset[]
  ability?: Ability
  itemEquipmentPreset: ItemEquipmentPreset[]
  cashEquipmentPreset: CashEquipmentPreset[]
  setEffect: SetEffect[]
  petEquipment: PetEquipment[]
  symbol: Symbol[]
  skill: Skill[]
  skillCore: SkillCore[]
  linkSkill: LinkSkill[]
  hexaStat: HexaStat[]
  union?: Union
}
