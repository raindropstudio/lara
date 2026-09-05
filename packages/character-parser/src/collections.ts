import {
  array,
  imageCode,
  integer,
  isoDate,
  number,
  readJson,
  record,
  text,
} from './read.js'
import { ParseContext, type ParseResult } from './result.js'
import type {
  HexaStat,
  LinkSkill,
  PetEquipment,
  SetEffect,
  Skill,
  SkillCore,
  SymbolInfo,
} from './types.js'

const symbolRate = (value: unknown, path: string, context: ParseContext) =>
  number(
    typeof value === 'string' && /^[+-]?\d+(?:\.\d+)?%$/.test(value)
      ? value.slice(0, -1)
      : value,
    path,
    context,
    false,
  )

export const parseSymbol = (
  body: Uint8Array | string,
): ParseResult<SymbolInfo[]> => {
  const context = new ParseContext()
  const root = record(readJson(body, context), '$', context)
  if (!root) return context.failed()
  const result: SymbolInfo[] = []
  array(root.symbol, '$.symbol', context, false).forEach((raw, index) => {
    const path = `$.symbol[${index}]`
    const item = record(raw, path, context)
    if (!item) return
    const values = {
      name: text(item.symbol_name, `${path}.symbol_name`, context),
      force: integer(item.symbol_force, `${path}.symbol_force`, context),
      level: integer(item.symbol_level, `${path}.symbol_level`, context),
      str: integer(item.symbol_str, `${path}.symbol_str`, context),
      dex: integer(item.symbol_dex, `${path}.symbol_dex`, context),
      int: integer(item.symbol_int, `${path}.symbol_int`, context),
      luk: integer(item.symbol_luk, `${path}.symbol_luk`, context),
      hp: integer(item.symbol_hp, `${path}.symbol_hp`, context),
      dropRate:
        symbolRate(
          item.symbol_drop_rate,
          `${path}.symbol_drop_rate`,
          context,
        ) ?? 0,
      mesoRate:
        symbolRate(
          item.symbol_meso_rate,
          `${path}.symbol_meso_rate`,
          context,
        ) ?? 0,
      expRate:
        symbolRate(item.symbol_exp_rate, `${path}.symbol_exp_rate`, context) ??
        0,
      growthCount: integer(
        item.symbol_growth_count,
        `${path}.symbol_growth_count`,
        context,
      ),
      requireGrowthCount: integer(
        item.symbol_require_growth_count,
        `${path}.symbol_require_growth_count`,
        context,
      ),
    }
    if (Object.values(values).some((value) => value === undefined)) return
    result.push(values as SymbolInfo)
  })
  return context.result(result)
}

export const parseSetEffect = (
  body: Uint8Array | string,
): ParseResult<SetEffect[]> => {
  const context = new ParseContext()
  const root = record(readJson(body, context), '$', context)
  if (!root) return context.failed()
  const result: SetEffect[] = []
  array(root.set_effect, '$.set_effect', context, false).forEach(
    (raw, index) => {
      const path = `$.set_effect[${index}]`
      const item = record(raw, path, context)
      if (!item) return
      const setName = text(item.set_name, `${path}.set_name`, context)
      const setCount = integer(
        item.total_set_count,
        `${path}.total_set_count`,
        context,
      )
      if (!setName || setCount === undefined) return
      const setOptionList: SetEffect['setOptionList'] = []
      array(
        item.set_option_full,
        `${path}.set_option_full`,
        context,
        false,
      ).forEach((rawOption, optionIndex) => {
        const optionPath = `${path}.set_option_full[${optionIndex}]`
        const option = record(rawOption, optionPath, context)
        if (!option) return
        const count = integer(
          option.set_count,
          `${optionPath}.set_count`,
          context,
        )
        const value = text(
          option.set_option,
          `${optionPath}.set_option`,
          context,
        )
        if (count !== undefined && value)
          setOptionList.push({ setCount: count, setOption: value })
      })
      result.push({ setName, setCount, setOptionList })
    },
  )
  return context.result(result)
}

const optionValue = (
  raw: unknown,
  optionType: string,
  path: string,
  context: ParseContext,
) => {
  for (const [index, entry] of array(raw, path, context, false).entries()) {
    const option = record(entry, `${path}[${index}]`, context)
    if (option?.option_type !== optionType) continue
    return number(
      option.option_value,
      `${path}[${index}].option_value`,
      context,
      false,
    )
  }
  return undefined
}

export const parsePetEquipment = (
  body: Uint8Array | string,
): ParseResult<PetEquipment[]> => {
  const context = new ParseContext()
  const root = record(readJson(body, context), '$', context)
  if (!root) return context.failed()
  const result: PetEquipment[] = []

  for (let petNo = 1; petNo <= 3; petNo++) {
    const prefix = `pet_${petNo}`
    const nameValue = root[`${prefix}_name`]
    if (nameValue === null || nameValue === undefined || nameValue === '')
      continue
    const petName = text(nameValue, `$.${prefix}_name`, context)
    const petNickname = text(
      root[`${prefix}_nickname`],
      `$.${prefix}_nickname`,
      context,
    )
    const petDescription = text(
      root[`${prefix}_description`],
      `$.${prefix}_description`,
      context,
    )
    if (!petName || !petNickname || !petDescription) continue

    const petInfo: PetEquipment['petInfo'] = {
      petName,
      petNickname,
      petDescription,
      petSkills: [],
    }
    const icon = imageCode(root[`${prefix}_icon`])
    if (icon) petInfo.petIcon = icon
    const petType = text(
      root[`${prefix}_pet_type`],
      `$.${prefix}_pet_type`,
      context,
      false,
    )
    if (petType) petInfo.petType = petType
    const skillValue = root[`${prefix}_skill`]
    if (Array.isArray(skillValue)) {
      petInfo.petSkills = skillValue.filter(
        (value): value is string => typeof value === 'string',
      )
    } else if (typeof skillValue === 'string' && skillValue !== '') {
      try {
        const parsed = JSON.parse(skillValue) as unknown
        if (Array.isArray(parsed))
          petInfo.petSkills = parsed.filter(
            (value): value is string => typeof value === 'string',
          )
        else
          context.issue(
            `$.${prefix}_skill`,
            'invalid_type',
            '펫 스킬 배열이 필요합니다.',
            parsed,
          )
      } catch {
        context.issue(
          `$.${prefix}_skill`,
          'invalid_json',
          '펫 스킬 문자열을 읽을 수 없습니다.',
          skillValue,
        )
      }
    }
    const dateExpire = isoDate(
      root[`${prefix}_date_expire`],
      `$.${prefix}_date_expire`,
      context,
    )
    if (dateExpire) petInfo.petDateExpire = dateExpire
    const appearance = text(
      root[`${prefix}_appearance`],
      `$.${prefix}_appearance`,
      context,
      false,
    )
    if (appearance) petInfo.petAppearance = appearance
    const appearanceIcon = imageCode(root[`${prefix}_appearance_icon`])
    if (appearanceIcon) petInfo.petAppearanceIcon = appearanceIcon

    const rawEquipment = root[`${prefix}_equipment`]
    if (rawEquipment !== null && rawEquipment !== undefined) {
      const path = `$.${prefix}_equipment`
      const equipment = record(rawEquipment, path, context)
      const itemName = equipment
        ? text(equipment.item_name, `${path}.item_name`, context, false)
        : undefined
      if (equipment && itemName) {
        const mapped: NonNullable<PetEquipment['petInfo']['petEquipment']> = {
          itemName,
        }
        const itemIcon = imageCode(equipment.item_icon)
        if (itemIcon) mapped.itemIcon = itemIcon
        const description = text(
          equipment.item_description,
          `${path}.item_description`,
          context,
          false,
        )
        if (description) mapped.itemDescription = description
        const numeric: Array<[keyof typeof mapped, string]> = [
          ['scrollUpgrade', 'scroll_upgrade'],
          ['scrollUpgradable', 'scroll_upgradable'],
        ]
        for (const [target, source] of numeric) {
          const value = integer(
            equipment[source],
            `${path}.${source}`,
            context,
            false,
          )
          if (value !== undefined)
            (mapped[target] as number | undefined) = value
        }
        const itemShape = text(
          equipment.item_shape,
          `${path}.item_shape`,
          context,
          false,
        )
        if (itemShape) mapped.itemShape = itemShape
        const itemShapeIcon = imageCode(equipment.item_shape_icon)
        if (itemShapeIcon) mapped.itemShapeIcon = itemShapeIcon
        const attackPower = optionValue(
          equipment.item_option,
          '공격력',
          `${path}.item_option`,
          context,
        )
        if (attackPower !== undefined) mapped.attackPower = attackPower
        const magicPower = optionValue(
          equipment.item_option,
          '마력',
          `${path}.item_option`,
          context,
        )
        if (magicPower !== undefined) mapped.magicPower = magicPower
        petInfo.petEquipment = mapped
      }
    }

    const rawAutoSkill = root[`${prefix}_auto_skill`]
    if (rawAutoSkill !== null && rawAutoSkill !== undefined) {
      const path = `$.${prefix}_auto_skill`
      const autoSkill = record(rawAutoSkill, path, context)
      if (autoSkill) {
        const mapped: NonNullable<PetEquipment['petInfo']['petAutoSkill']> = {}
        for (const slot of [1, 2] as const) {
          const skill = text(
            autoSkill[`skill_${slot}`],
            `${path}.skill_${slot}`,
            context,
            false,
          )
          if (!skill) continue
          mapped[`skill${slot}`] = skill
          const icon = imageCode(autoSkill[`skill_${slot}_icon`])
          if (icon) mapped[`skill${slot}Icon`] = icon
        }
        if (mapped.skill1 || mapped.skill2) petInfo.petAutoSkill = mapped
      }
    }
    result.push({ petNo, petInfo })
  }
  return context.result(result)
}

const mapSkill = (
  raw: unknown,
  path: string,
  context: ParseContext,
  grade: string,
): Skill | undefined => {
  const item = record(raw, path, context)
  if (!item) return undefined
  const name = text(item.skill_name, `${path}.skill_name`, context)
  const level = integer(item.skill_level, `${path}.skill_level`, context)
  if (!name || level === undefined) return undefined
  const result: Skill = { grade, name, level }
  const description = text(
    item.skill_description,
    `${path}.skill_description`,
    context,
    false,
  )
  if (description) result.description = description
  const icon = imageCode(item.skill_icon)
  if (icon) result.icon = icon
  const effect = text(item.skill_effect, `${path}.skill_effect`, context, false)
  if (effect) result.effect = effect
  const effectNext = text(
    item.skill_effect_next,
    `${path}.skill_effect_next`,
    context,
    false,
  )
  if (effectNext) result.effectNext = effectNext
  return result
}

export const parseSkill = (
  body: Uint8Array | string,
  grade: string,
): ParseResult<Skill[]> => {
  const context = new ParseContext()
  const root = record(readJson(body, context), '$', context)
  if (!root) return context.failed()
  const result = array(
    root.character_skill,
    '$.character_skill',
    context,
    false,
  ).flatMap((raw, index) => {
    const mapped = mapSkill(raw, `$.character_skill[${index}]`, context, grade)
    return mapped ? [mapped] : []
  })
  return context.result(result)
}

export const parseLinkSkill = (
  body: Uint8Array | string,
): ParseResult<LinkSkill[]> => {
  const context = new ParseContext()
  const root = record(readJson(body, context), '$', context)
  if (!root) return context.failed()
  const result: LinkSkill[] = []
  for (const presetNo of [0, 1, 2, 3]) {
    const suffix = presetNo === 0 ? '' : `_preset_${presetNo}`
    const skillsKey = `character_link_skill${suffix}`
    const ownedKey = `character_owned_link_skill${suffix}`
    const skills = array(
      root[skillsKey],
      `$.${skillsKey}`,
      context,
      false,
    ).flatMap((raw, index) => {
      const mapped = mapSkill(raw, `$.${skillsKey}[${index}]`, context, 'link')
      return mapped ? [mapped] : []
    })
    const rawOwned = root[ownedKey]
    const ownedSkill =
      rawOwned === null || rawOwned === undefined
        ? undefined
        : mapSkill(rawOwned, `$.${ownedKey}`, context, 'link')
    if (skills.length === 0 && !ownedSkill) continue
    const preset: LinkSkill = { presetNo, skill: skills }
    if (ownedSkill) preset.ownedSkill = ownedSkill
    result.push(preset)
  }
  return context.result(result)
}

export const parseVMatrix = (
  body: Uint8Array | string,
): ParseResult<SkillCore[]> => parseCores(body, 5)

export const parseHexaMatrix = (
  body: Uint8Array | string,
): ParseResult<SkillCore[]> => parseCores(body, 6)

const parseCores = (
  body: Uint8Array | string,
  grade: 5 | 6,
): ParseResult<SkillCore[]> => {
  const context = new ParseContext()
  const root = record(readJson(body, context), '$', context)
  if (!root) return context.failed()
  const sourceKey =
    grade === 5 ? 'character_v_core_equipment' : 'character_hexa_core_equipment'
  const result: SkillCore[] = []
  array(root[sourceKey], `$.${sourceKey}`, context, false).forEach(
    (raw, index) => {
      const path = `$.${sourceKey}[${index}]`
      const item = record(raw, path, context)
      if (!item) return
      const coreName = text(
        item[grade === 5 ? 'v_core_name' : 'hexa_core_name'],
        `${path}.${grade === 5 ? 'v_core_name' : 'hexa_core_name'}`,
        context,
      )
      const coreType = text(
        item[grade === 5 ? 'v_core_type' : 'hexa_core_type'],
        `${path}.${grade === 5 ? 'v_core_type' : 'hexa_core_type'}`,
        context,
      )
      const coreLevel = integer(
        item[grade === 5 ? 'v_core_level' : 'hexa_core_level'],
        `${path}.${grade === 5 ? 'v_core_level' : 'hexa_core_level'}`,
        context,
      )
      if (!coreName || !coreType || coreLevel === undefined) return
      const coreSkill =
        grade === 5
          ? [
              item.v_core_skill_1,
              item.v_core_skill_2,
              item.v_core_skill_3,
            ].filter(
              (value): value is string =>
                typeof value === 'string' && value !== '',
            )
          : array(
              item.linked_skill,
              `${path}.linked_skill`,
              context,
              false,
            ).flatMap((rawSkill, skillIndex) => {
              const skill = record(
                rawSkill,
                `${path}.linked_skill[${skillIndex}]`,
                context,
              )
              return typeof skill?.hexa_skill_id === 'string'
                ? [skill.hexa_skill_id]
                : []
            })
      const mapped: SkillCore = {
        skillCore: { grade, coreName, coreType, coreSkill },
        coreLevel,
      }
      if (grade === 5) {
        const slotId = integer(item.slot_id, `${path}.slot_id`, context, false)
        if (slotId !== undefined) mapped.slotId = slotId
        const slotLevel = integer(
          item.slot_level,
          `${path}.slot_level`,
          context,
          false,
        )
        if (slotLevel !== undefined) mapped.slotLevel = slotLevel
      }
      result.push(mapped)
    },
  )
  return context.result(result)
}

const mapHexaStat = (
  raw: unknown,
  path: string,
  context: ParseContext,
  hexaStatNo: number,
): Omit<HexaStat, 'active'> | undefined => {
  const item = record(raw, path, context)
  if (!item) return undefined
  // 미사용 HEXA 프리셋은 이름이 null이고 모든 강화 수치가 0이다.
  if (
    ['main_stat_name', 'sub_stat_name_1', 'sub_stat_name_2'].every(
      (key) => item[key] === null,
    ) &&
    [
      'main_stat_level',
      'sub_stat_level_1',
      'sub_stat_level_2',
      'stat_grade',
    ].every((key) => item[key] === 0)
  )
    return undefined
  const values = {
    hexaStatNo,
    presetNo: integer(item.slot_id, `${path}.slot_id`, context),
    mainStatName: text(item.main_stat_name, `${path}.main_stat_name`, context),
    mainStatLevel: integer(
      item.main_stat_level,
      `${path}.main_stat_level`,
      context,
    ),
    subStat1Name: text(
      item.sub_stat_name_1,
      `${path}.sub_stat_name_1`,
      context,
    ),
    subStat1Level: integer(
      item.sub_stat_level_1,
      `${path}.sub_stat_level_1`,
      context,
    ),
    subStat2Name: text(
      item.sub_stat_name_2,
      `${path}.sub_stat_name_2`,
      context,
    ),
    subStat2Level: integer(
      item.sub_stat_level_2,
      `${path}.sub_stat_level_2`,
      context,
    ),
    statGrade: integer(item.stat_grade, `${path}.stat_grade`, context),
  }
  if (Object.values(values).some((value) => value === undefined))
    return undefined
  return values as Omit<HexaStat, 'active'>
}

export const parseHexaStat = (
  body: Uint8Array | string,
): ParseResult<HexaStat[]> => {
  const context = new ParseContext()
  const root = record(readJson(body, context), '$', context)
  if (!root) return context.failed()
  const result: HexaStat[] = []

  for (const hexaStatNo of [1, 2, 3]) {
    const suffix = hexaStatNo === 1 ? '' : `_${hexaStatNo}`
    const currentKey = `character_hexa_stat_core${suffix}`
    const presetKey = `preset_hexa_stat_core${suffix}`
    const currentRaw = array(
      root[currentKey],
      `$.${currentKey}`,
      context,
      false,
    )[0]
    if (!currentRaw) continue
    const current = mapHexaStat(
      currentRaw,
      `$.${currentKey}[0]`,
      context,
      hexaStatNo,
    )
    if (!current) continue
    array(root[presetKey], `$.${presetKey}`, context, false).forEach(
      (raw, index) => {
        const preset = mapHexaStat(
          raw,
          `$.${presetKey}[${index}]`,
          context,
          hexaStatNo,
        )
        if (preset)
          result.push({
            ...preset,
            active: preset.presetNo === current.presetNo,
          })
      },
    )
  }
  return context.result(result)
}
