import {
  array,
  booleanFlag,
  imageCode,
  integer,
  isoDate,
  number,
  readJson,
  record,
  text,
  type UnknownRecord,
} from './read.js'
import { ParseContext, type ParseResult } from './result.js'
import type {
  CharacterBasic,
  HyperStatPreset,
  Propensity,
  Stat,
  Union,
} from './types.js'

export type ParseMetadata = {
  ocid?: string
  popularity?: number
  skillGrade?: string
}

export const parseOcid = (
  body: Uint8Array | string,
): ParseResult<{ ocid: string }> => {
  const context = new ParseContext()
  const root = record(readJson(body, context), '$', context)
  const ocid = root && text(root.ocid, '$.ocid', context)
  return context.result(ocid ? { ocid } : undefined)
}

export const parsePopularity = (
  body: Uint8Array | string,
): ParseResult<number> => {
  const context = new ParseContext()
  const root = record(readJson(body, context), '$', context)
  const popularity = root
    ? integer(root.popularity, '$.popularity', context)
    : undefined
  return context.result(popularity)
}

export const parseBasic = (
  body: Uint8Array | string,
  metadata: ParseMetadata = {},
): ParseResult<CharacterBasic> => {
  const context = new ParseContext()
  const root = record(readJson(body, context), '$', context)
  if (!root) return context.failed()

  const ocid = metadata.ocid
  if (!ocid) context.issue('$.ocid', 'missing_required', 'OCID가 필요합니다.')

  const nickname = text(root.character_name, '$.character_name', context)
  const worldName = text(root.world_name, '$.world_name', context)
  const gender = text(root.character_gender, '$.character_gender', context)
  const characterClass = text(
    root.character_class,
    '$.character_class',
    context,
  )
  const classLevel = text(
    root.character_class_level,
    '$.character_class_level',
    context,
  )
  const level = integer(root.character_level, '$.character_level', context)
  const expRaw = root.character_exp
  const exp =
    typeof expRaw === 'string' || typeof expRaw === 'number'
      ? String(expRaw)
      : undefined
  if (exp === undefined)
    context.issue(
      '$.character_exp',
      'missing_required',
      '경험치가 필요합니다.',
      expRaw,
    )
  const expRate = number(
    root.character_exp_rate,
    '$.character_exp_rate',
    context,
  )
  const rawImage = text(root.character_image, '$.character_image', context)
  const parsedImage = imageCode(rawImage)

  if (
    !ocid ||
    !nickname ||
    !worldName ||
    !gender ||
    !characterClass ||
    !classLevel ||
    level === undefined ||
    exp === undefined ||
    expRate === undefined ||
    !parsedImage
  ) {
    return context.failed()
  }

  const value: CharacterBasic = {
    ocid,
    nickname,
    worldName,
    gender,
    class: characterClass,
    classLevel,
    level,
    exp,
    expRate,
    imageUrl: parsedImage,
  }

  const guildName = text(
    root.character_guild_name,
    '$.character_guild_name',
    context,
    false,
  )
  if (guildName !== undefined) value.guildName = guildName

  const dateCreate = isoDate(
    root.character_date_create,
    '$.character_date_create',
    context,
  )
  if (dateCreate !== undefined) value.dateCreate = dateCreate

  if (root.access_flag !== null && root.access_flag !== undefined) {
    const accessFlag = booleanFlag(root.access_flag, '$.access_flag', context)
    if (accessFlag !== undefined) value.accessFlag = accessFlag
  }

  if (
    root.liberation_quest_clear_flag !== null &&
    root.liberation_quest_clear_flag !== undefined
  ) {
    const liberationQuestClear = booleanFlag(
      root.liberation_quest_clear_flag,
      '$.liberation_quest_clear_flag',
      context,
    )
    if (liberationQuestClear !== undefined)
      value.liberationQuestClear = liberationQuestClear
  }

  if (metadata.popularity !== undefined) value.popularity = metadata.popularity
  const updatedAt = isoDate(root.date, '$.date', context)
  if (updatedAt !== undefined) value.updatedAt = updatedAt

  return context.result(value)
}

const statNames: Record<string, keyof Stat> = {
  '최대 스탯공격력': 'maxStatAttackPower',
  '최소 스탯공격력': 'minStatAttackPower',
  데미지: 'damage',
  '보스 몬스터 데미지': 'bossMonsterDamage',
  '최종 데미지': 'finalDamage',
  '방어율 무시': 'ignoreDefenseRate',
  '크리티컬 확률': 'criticalRate',
  '크리티컬 데미지': 'criticalDamage',
  '상태이상 내성': 'abnormalStatusResistance',
  스탠스: 'stance',
  방어력: 'defense',
  이동속도: 'moveSpeed',
  점프력: 'jumpPower',
  스타포스: 'starForce',
  아케인포스: 'arcaneForce',
  어센틱포스: 'authenticForce',
  STR: 'str',
  DEX: 'dex',
  INT: 'int',
  LUK: 'luk',
  HP: 'hp',
  MP: 'mp',
  'AP 배분 STR': 'apStr',
  'AP 배분 DEX': 'apDex',
  'AP 배분 INT': 'apInt',
  'AP 배분 LUK': 'apLuk',
  'AP 배분 HP': 'apHp',
  'AP 배분 MP': 'apMp',
  '아이템 드롭률': 'itemDropRate',
  '메소 획득량': 'mesoAcquisition',
  '버프 지속시간': 'buffDuration',
  '공격 속도': 'attackSpeed',
  '일반 몬스터 데미지': 'normalMonsterDamage',
  '재사용 대기시간 감소 (%)': 'cooldownReductionPercent',
  '재사용 대기시간 감소 (초)': 'cooldownReductionSeconds',
  '재사용 대기시간 미적용': 'cooldownExemption',
  '속성 내성 무시': 'ignoreAttributeResistance',
  '상태이상 추가 데미지': 'abnormalStatusAdditionalDamage',
  '무기 숙련도': 'weaponMastery',
  '추가 경험치 획득': 'additionalExp',
  공격력: 'attackPower',
  마력: 'magicPower',
  전투력: 'combatPower',
  '소환수 지속시간 증가': 'summonDurationIncrease',
}

export const parseStat = (body: Uint8Array | string): ParseResult<Stat> => {
  const context = new ParseContext()
  const root = record(readJson(body, context), '$', context)
  if (!root) return context.failed()

  const result: Stat = {}
  const stats = array(root.final_stat, '$.final_stat', context)
  stats.forEach((raw, index) => {
    const path = `$.final_stat[${index}]`
    const item = record(raw, path, context)
    if (!item) return
    const name = text(item.stat_name, `${path}.stat_name`, context)
    const value = number(item.stat_value, `${path}.stat_value`, context)
    if (!name || value === undefined) return
    const key = statNames[name]
    if (!key) {
      context.unknown(`${path}.stat_name`, `알 수 없는 stat: ${name}`, name)
      return
    }
    result[key] = value
  })

  const remainAp = number(root.remain_ap, '$.remain_ap', context, false)
  if (remainAp !== undefined) result.remainAp = remainAp
  return context.result(result)
}

export const parseHyperStat = (
  body: Uint8Array | string,
): ParseResult<HyperStatPreset[]> => {
  const context = new ParseContext()
  const root = record(readJson(body, context), '$', context)
  if (!root) return context.failed()
  const activePreset = text(
    root.use_preset_no,
    '$.use_preset_no',
    context,
    false,
  )

  const presets: HyperStatPreset[] = []
  for (const presetNo of [1, 2, 3]) {
    const key = `hyper_stat_preset_${presetNo}`
    const rawPreset = array(root[key], `$.${key}`, context, false)
    const remainPoint =
      integer(
        root[`${key}_remain_point`],
        `$.${key}_remain_point`,
        context,
        false,
      ) ?? 0
    const hyperStatInfo: HyperStatPreset['hyperStatInfo'] = []

    rawPreset.forEach((raw, index) => {
      const path = `$.${key}[${index}]`
      const item = record(raw, path, context)
      if (!item) return
      const statPoint = integer(
        item.stat_point,
        `${path}.stat_point`,
        context,
        false,
      )
      if (statPoint === undefined || statPoint === 0) return
      const statType = text(item.stat_type, `${path}.stat_type`, context)
      const statLevel = integer(item.stat_level, `${path}.stat_level`, context)
      const statIncrease = text(
        item.stat_increase,
        `${path}.stat_increase`,
        context,
      )
      if (statType && statLevel !== undefined && statIncrease)
        hyperStatInfo.push({ statType, statLevel, statPoint, statIncrease })
    })

    presets.push({
      presetNo,
      active: activePreset === String(presetNo),
      remainPoint,
      hyperStatInfo,
    })
  }

  return context.result(presets)
}

export const parsePropensity = (
  body: Uint8Array | string,
): ParseResult<Propensity> => {
  const context = new ParseContext()
  const root = record(readJson(body, context), '$', context)
  if (!root) return context.failed()

  const fields = {
    charismaLevel: 'charisma_level',
    sensibilityLevel: 'sensibility_level',
    insightLevel: 'insight_level',
    willingnessLevel: 'willingness_level',
    handicraftLevel: 'handicraft_level',
    charmLevel: 'charm_level',
  } as const
  const result: Partial<Propensity> = {}

  for (const [target, source] of Object.entries(fields)) {
    const value = integer(root[source], `$.${source}`, context)
    if (value !== undefined) result[target as keyof Propensity] = value as never
  }

  if (Object.keys(result).length !== Object.keys(fields).length)
    return context.failed()
  return context.result(result as Propensity)
}

export const parseUnion = (
  body: Uint8Array | string,
): ParseResult<Union | null> => {
  const context = new ParseContext()
  const parsed = readJson(body, context)
  if (parsed === null) return context.result(null)
  const root = record(parsed, '$', context)
  if (!root) return context.failed()

  const unionLevel = integer(root.union_level, '$.union_level', context)
  const unionArtifactLevel = integer(
    root.union_artifact_level,
    '$.union_artifact_level',
    context,
  )
  const unionArtifactExp = integer(
    root.union_artifact_exp,
    '$.union_artifact_exp',
    context,
  )
  const unionArtifactPoint = integer(
    root.union_artifact_point,
    '$.union_artifact_point',
    context,
  )
  if (
    unionLevel === undefined ||
    unionArtifactLevel === undefined ||
    unionArtifactExp === undefined ||
    unionArtifactPoint === undefined
  )
    return context.failed()

  return context.result({
    unionLevel,
    unionArtifactLevel,
    unionArtifactExp,
    unionArtifactPoint,
  })
}

export const parseJsonRecord = (
  body: Uint8Array | string,
): ParseResult<UnknownRecord> => {
  const context = new ParseContext()
  const value = record(readJson(body, context), '$', context)
  return context.result(value)
}
