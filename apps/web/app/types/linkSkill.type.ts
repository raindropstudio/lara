export interface LinkSkill {
  ownedSkill?: Skill
  skill: Skill[]
  presetNo: number // 링크스킬은 항상 0번이 적용중 1, 2, 3 은 프리셋
}
