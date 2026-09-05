export interface SkillCoreInfo {
  grade: number
  coreName: string
  coreType: string
  coreSkill: string[]
}

export interface SkillCore {
  skillCore: SkillCoreInfo
  slotId?: number | null
  slotLevel?: number | null
  coreLevel: number
}
