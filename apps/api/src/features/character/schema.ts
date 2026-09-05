import { t, type TSchema } from 'elysia'

export const issueSchema = t.Object({
  path: t.String(),
  code: t.String(),
  message: t.String(),
  receivedType: t.Optional(t.String()),
})

const sectionSchema = <Schema extends TSchema>(data: Schema) =>
  t.Object({
    status: t.Union([
      t.Literal('complete'),
      t.Literal('partial'),
      t.Literal('failed'),
      t.Literal('unavailable'),
    ]),
    observedAt: t.String({ format: 'date-time' }),
    parserVersion: t.String(),
    issues: t.Array(issueSchema),
    stale: t.Boolean(),
    data: t.Optional(data),
  })

const basicSchema = t.Object({
  ocid: t.String(),
  nickname: t.String(),
  worldName: t.String(),
  gender: t.String(),
  class: t.String(),
  classLevel: t.String(),
  level: t.Number(),
  exp: t.String(),
  expRate: t.Number(),
  guildName: t.Optional(t.String()),
  imageUrl: t.String(),
  dateCreate: t.Optional(t.String({ format: 'date-time' })),
  accessFlag: t.Optional(t.Boolean()),
  liberationQuestClear: t.Optional(t.Boolean()),
  popularity: t.Optional(t.Number()),
  updatedAt: t.Optional(t.String({ format: 'date-time' })),
})

const statSchema = t.Partial(
  t.Object({
    maxStatAttackPower: t.Number(),
    minStatAttackPower: t.Number(),
    damage: t.Number(),
    bossMonsterDamage: t.Number(),
    finalDamage: t.Number(),
    ignoreDefenseRate: t.Number(),
    criticalRate: t.Number(),
    criticalDamage: t.Number(),
    abnormalStatusResistance: t.Number(),
    stance: t.Number(),
    defense: t.Number(),
    moveSpeed: t.Number(),
    jumpPower: t.Number(),
    starForce: t.Number(),
    arcaneForce: t.Number(),
    authenticForce: t.Number(),
    str: t.Number(),
    dex: t.Number(),
    int: t.Number(),
    luk: t.Number(),
    hp: t.Number(),
    mp: t.Number(),
    apStr: t.Number(),
    apDex: t.Number(),
    apInt: t.Number(),
    apLuk: t.Number(),
    apHp: t.Number(),
    apMp: t.Number(),
    itemDropRate: t.Number(),
    mesoAcquisition: t.Number(),
    buffDuration: t.Number(),
    attackSpeed: t.Number(),
    normalMonsterDamage: t.Number(),
    cooldownReductionPercent: t.Number(),
    cooldownReductionSeconds: t.Number(),
    cooldownExemption: t.Number(),
    ignoreAttributeResistance: t.Number(),
    abnormalStatusAdditionalDamage: t.Number(),
    weaponMastery: t.Number(),
    additionalExp: t.Number(),
    attackPower: t.Number(),
    magicPower: t.Number(),
    combatPower: t.Number(),
    summonDurationIncrease: t.Number(),
    remainAp: t.Number(),
  }),
)

const hyperStatSchema = t.Array(
  t.Object({
    presetNo: t.Number(),
    active: t.Boolean(),
    remainPoint: t.Number(),
    hyperStatInfo: t.Array(
      t.Object({
        statType: t.String(),
        statPoint: t.Number(),
        statLevel: t.Number(),
        statIncrease: t.String(),
      }),
    ),
  }),
)

const propensitySchema = t.Object({
  charismaLevel: t.Number(),
  sensibilityLevel: t.Number(),
  insightLevel: t.Number(),
  willingnessLevel: t.Number(),
  handicraftLevel: t.Number(),
  charmLevel: t.Number(),
})

const skillSchema = t.Object({
  grade: t.String(),
  name: t.String(),
  description: t.Optional(t.String()),
  level: t.Number(),
  icon: t.Optional(t.String()),
  effect: t.Optional(t.String()),
  effectNext: t.Optional(t.String()),
})

const abilitySchema = t.Object({
  preset: t.Array(
    t.Object({
      abilityInfo: t.Array(
        t.Object({
          abilityGrade: t.Union([
            t.Literal('LEGENDARY'),
            t.Literal('UNIQUE'),
            t.Literal('EPIC'),
            t.Literal('RARE'),
            t.Literal('NORMAL'),
            t.Literal('UNKNOWN'),
          ]),
          abilityNo: t.Number(),
          abilityValue: t.String(),
        }),
      ),
      presetNo: t.Number(),
      active: t.Boolean(),
    }),
  ),
  remainFame: t.Number(),
})

const symbolInfoSchema = t.Object({
  name: t.String(),
  force: t.Number(),
  level: t.Number(),
  str: t.Number(),
  dex: t.Number(),
  int: t.Number(),
  luk: t.Number(),
  hp: t.Number(),
  dropRate: t.Number(),
  mesoRate: t.Number(),
  expRate: t.Number(),
  growthCount: t.Number(),
  requireGrowthCount: t.Number(),
})

const setEffectSchema = t.Object({
  setName: t.String(),
  setOptionList: t.Array(
    t.Object({
      setCount: t.Number(),
      setOption: t.String(),
    }),
  ),
  setCount: t.Number(),
})

const petEquipmentSchema = t.Object({
  petNo: t.Number(),
  petInfo: t.Object({
    petName: t.String(),
    petNickname: t.String(),
    petIcon: t.Optional(t.String()),
    petDescription: t.String(),
    petType: t.Optional(t.String()),
    petSkills: t.Array(t.String()),
    petDateExpire: t.Optional(t.String({ format: 'date-time' })),
    petAppearance: t.Optional(t.String()),
    petAppearanceIcon: t.Optional(t.String()),
    petEquipment: t.Optional(
      t.Object({
        itemName: t.String(),
        itemIcon: t.Optional(t.String()),
        itemDescription: t.Optional(t.String()),
        scrollUpgrade: t.Optional(t.Number()),
        scrollUpgradable: t.Optional(t.Number()),
        itemShape: t.Optional(t.String()),
        itemShapeIcon: t.Optional(t.String()),
        attackPower: t.Optional(t.Number()),
        magicPower: t.Optional(t.Number()),
      }),
    ),
    petAutoSkill: t.Optional(
      t.Object({
        skill1: t.Optional(t.String()),
        skill1Icon: t.Optional(t.String()),
        skill2: t.Optional(t.String()),
        skill2Icon: t.Optional(t.String()),
      }),
    ),
  }),
})

const linkSkillSchema = t.Object({
  ownedSkill: t.Optional(skillSchema),
  skill: t.Array(skillSchema),
  presetNo: t.Number(),
})

const hexaStatSchema = t.Object({
  hexaStatNo: t.Number(),
  presetNo: t.Number(),
  active: t.Boolean(),
  mainStatName: t.String(),
  mainStatLevel: t.Number(),
  subStat1Name: t.String(),
  subStat1Level: t.Number(),
  subStat2Name: t.String(),
  subStat2Level: t.Number(),
  statGrade: t.Number(),
})

const unionSchema = t.Object({
  unionLevel: t.Number(),
  unionArtifactLevel: t.Number(),
  unionArtifactExp: t.Number(),
  unionArtifactPoint: t.Number(),
})

const itemOptionSchema = t.Partial(
  t.Object({
    str: t.Number(),
    dex: t.Number(),
    int: t.Number(),
    luk: t.Number(),
    maxHp: t.Number(),
    maxMp: t.Number(),
    attackPower: t.Number(),
    magicPower: t.Number(),
    armor: t.Number(),
    speed: t.Number(),
    jump: t.Number(),
    bossDamage: t.Number(),
    ignoreMonsterArmor: t.Number(),
    allStat: t.Number(),
    damage: t.Number(),
    equipmentLevelDecrease: t.Number(),
    maxHpRate: t.Number(),
    maxMpRate: t.Number(),
    baseEquipmentLevel: t.Number(),
    exceptionalUpgrade: t.Number(),
  }),
)

const itemSchema = t.Object({
  part: t.String(),
  slot: t.String(),
  name: t.String(),
  icon: t.Optional(t.String()),
  description: t.Optional(t.String()),
  shapeName: t.Optional(t.String()),
  shapeIcon: t.Optional(t.String()),
  gender: t.Optional(t.String()),
  potentialOptionGrade: t.Optional(t.String()),
  additionalPotentialOptionGrade: t.Optional(t.String()),
  potentialOption: t.Array(t.String()),
  additionalPotentialOption: t.Array(t.String()),
  equipmentLevelIncrease: t.Optional(t.Number()),
  growthExp: t.Optional(t.Number()),
  growthLevel: t.Optional(t.Number()),
  scrollUpgrade: t.Optional(t.Number()),
  cuttableCount: t.Optional(t.Number()),
  goldenHammerFlag: t.Optional(t.Boolean()),
  scrollResilienceCount: t.Optional(t.Number()),
  scrollUpgradeableCount: t.Optional(t.Number()),
  soulName: t.Optional(t.String()),
  soulOption: t.Optional(t.String()),
  starforce: t.Optional(t.Number()),
  starforceScrollFlag: t.Optional(t.Boolean()),
  specialRingLevel: t.Optional(t.Number()),
  dateExpire: t.Optional(t.String({ format: 'date-time' })),
  dateOptionExpire: t.Optional(t.String({ format: 'date-time' })),
  totalOption: t.Optional(itemOptionSchema),
  baseOption: t.Optional(itemOptionSchema),
  exceptionalOption: t.Optional(itemOptionSchema),
  addOption: t.Optional(itemOptionSchema),
  etcOption: t.Optional(itemOptionSchema),
  starforceOption: t.Optional(itemOptionSchema),
})

const cashItemSchema = t.Object({
  part: t.String(),
  slot: t.String(),
  name: t.String(),
  icon: t.Optional(t.String()),
  description: t.Optional(t.String()),
  dateExpire: t.Optional(t.String({ format: 'date-time' })),
  dateOptionExpire: t.Optional(t.String({ format: 'date-time' })),
  label: t.Optional(t.String()),
  itemGender: t.Optional(t.String()),
  option: t.Optional(itemOptionSchema),
  coloringPrismRange: t.Optional(t.String()),
  coloringPrismHue: t.Optional(t.Number()),
  coloringPrismSaturation: t.Optional(t.Number()),
  coloringPrismValue: t.Optional(t.Number()),
})

const skillCoreSchema = t.Object({
  skillCore: t.Object({
    grade: t.Number(),
    coreName: t.String(),
    coreType: t.String(),
    coreSkill: t.Array(t.String()),
  }),
  slotId: t.Optional(t.Number()),
  slotLevel: t.Optional(t.Number()),
  coreLevel: t.Number(),
})

const itemEquipmentPresetSchema = t.Object({
  itemEquipmentInfo: t.Array(itemSchema),
  presetNo: t.Number(),
  active: t.Boolean(),
})

const cashEquipmentPresetSchema = t.Object({
  presetNo: t.Number(),
  active: t.Boolean(),
  cashEquipmentInfo: t.Array(cashItemSchema),
})

export const characterViewSchema = t.Object({
  ocid: t.String(),
  nickname: t.String(),
  aliases: t.Array(t.String()),
  updatedAt: t.String({ format: 'date-time' }),
  sections: t.Object({
    basic: t.Optional(sectionSchema(basicSchema)),
    popularity: t.Optional(sectionSchema(t.Number())),
    stat: t.Optional(sectionSchema(statSchema)),
    hyperStat: t.Optional(sectionSchema(hyperStatSchema)),
    propensity: t.Optional(sectionSchema(propensitySchema)),
    ability: t.Optional(sectionSchema(abilitySchema)),
    itemEquipment: t.Optional(
      sectionSchema(t.Array(itemEquipmentPresetSchema)),
    ),
    cashEquipment: t.Optional(
      sectionSchema(t.Array(cashEquipmentPresetSchema)),
    ),
    symbol: t.Optional(sectionSchema(t.Array(symbolInfoSchema))),
    setEffect: t.Optional(sectionSchema(t.Array(setEffectSchema))),
    beautyEquipment: t.Optional(
      sectionSchema(t.Record(t.String(), t.Unknown())),
    ),
    androidEquipment: t.Optional(
      sectionSchema(t.Record(t.String(), t.Unknown())),
    ),
    petEquipment: t.Optional(sectionSchema(t.Array(petEquipmentSchema))),
    skill5: t.Optional(sectionSchema(t.Array(skillSchema))),
    skill6: t.Optional(sectionSchema(t.Array(skillSchema))),
    linkSkill: t.Optional(sectionSchema(t.Array(linkSkillSchema))),
    vMatrix: t.Optional(sectionSchema(t.Array(skillCoreSchema))),
    hexaMatrix: t.Optional(sectionSchema(t.Array(skillCoreSchema))),
    hexaStat: t.Optional(sectionSchema(t.Array(hexaStatSchema))),
    union: t.Optional(sectionSchema(t.Union([unionSchema, t.Null()]))),
  }),
})

export const legacyCharacterSchema = t.Object({
  nickname: t.String(),
  worldName: t.String(),
  gender: t.String(),
  class: t.String(),
  classLevel: t.String(),
  level: t.Number(),
  exp: t.String(),
  expRate: t.Number(),
  guildName: t.Optional(t.String()),
  imageUrl: t.String(),
  dateCreate: t.Optional(t.String({ format: 'date-time' })),
  accessFlag: t.Optional(t.Boolean()),
  liberationQuestClear: t.Boolean(),
  popularity: t.Optional(t.Number()),
  updatedAt: t.String({ format: 'date-time' }),
  stat: statSchema,
  hyperStatPreset: hyperStatSchema,
  propensity: propensitySchema,
  ability: t.Optional(abilitySchema),
  itemEquipmentPreset: t.Array(itemEquipmentPresetSchema),
  cashEquipmentPreset: t.Array(cashEquipmentPresetSchema),
  union: t.Optional(unionSchema),
  setEffect: t.Array(setEffectSchema),
  petEquipment: t.Array(petEquipmentSchema),
  symbol: t.Array(symbolInfoSchema),
  skill: t.Array(skillSchema),
  linkSkill: t.Array(linkSkillSchema),
  skillCore: t.Array(skillCoreSchema),
  hexaStat: t.Array(hexaStatSchema),
})

export const characterNotFoundSchema = t.Object({
  code: t.Literal('CHARACTER_NOT_FOUND'),
  message: t.String(),
})
