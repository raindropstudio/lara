import {
  array,
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
  CashEquipmentPreset,
  ItemEquipmentInfo,
  ItemEquipmentPreset,
  ItemOption,
} from './types.js'

const optionKeys: Record<string, keyof ItemOption> = {
  str: 'str',
  dex: 'dex',
  int: 'int',
  luk: 'luk',
  max_hp: 'maxHp',
  max_mp: 'maxMp',
  attack_power: 'attackPower',
  magic_power: 'magicPower',
  armor: 'armor',
  speed: 'speed',
  jump: 'jump',
  boss_damage: 'bossDamage',
  ignore_monster_armor: 'ignoreMonsterArmor',
  all_stat: 'allStat',
  damage: 'damage',
  equipment_level_decrease: 'equipmentLevelDecrease',
  max_hp_rate: 'maxHpRate',
  max_mp_rate: 'maxMpRate',
  base_equipment_level: 'baseEquipmentLevel',
  exceptional_upgrade: 'exceptionalUpgrade',
}

const mapOption = (
  raw: unknown,
  path: string,
  context: ParseContext,
): ItemOption | undefined => {
  if (raw === null || raw === undefined) return undefined
  const source = record(raw, path, context)
  if (!source) return undefined
  const result: ItemOption = {}
  for (const [sourceKey, targetKey] of Object.entries(optionKeys)) {
    const value = number(
      source[sourceKey],
      `${path}.${sourceKey}`,
      context,
      false,
    )
    if (value !== undefined) result[targetKey] = value
  }
  return Object.keys(result).length === 0 ? undefined : result
}

const grades: Record<string, string> = {
  레어: 'RARE',
  에픽: 'EPIC',
  유니크: 'UNIQUE',
  레전드리: 'LEGENDARY',
}

const mapGrade = (value: unknown, path: string, context: ParseContext) => {
  if (value === null || value === undefined || value === '') return undefined
  const raw = text(value, path, context)
  if (!raw) return undefined
  const mapped = grades[raw]
  if (!mapped) context.unknown(path, `알 수 없는 잠재 등급: ${raw}`, raw)
  return mapped ?? 'UNKNOWN'
}

const assignOptional = <T extends object, K extends keyof T>(
  target: T,
  key: K,
  value: T[K] | undefined,
) => {
  if (value !== undefined) target[key] = value
}

const mapItem = (
  raw: unknown,
  path: string,
  context: ParseContext,
): ItemEquipmentInfo | undefined => {
  const item = record(raw, path, context)
  if (!item) return undefined
  const part = text(
    item.item_equipment_part,
    `${path}.item_equipment_part`,
    context,
  )
  const slot = text(
    item.item_equipment_slot,
    `${path}.item_equipment_slot`,
    context,
  )
  const name = text(item.item_name, `${path}.item_name`, context)
  if (!part || !slot || !name) return undefined

  const result: ItemEquipmentInfo = {
    part,
    slot,
    name,
    potentialOption: [
      item.potential_option_1,
      item.potential_option_2,
      item.potential_option_3,
    ].filter(
      (value): value is string => typeof value === 'string' && value !== '',
    ),
    additionalPotentialOption: [
      item.additional_potential_option_1,
      item.additional_potential_option_2,
      item.additional_potential_option_3,
    ].filter(
      (value): value is string => typeof value === 'string' && value !== '',
    ),
  }

  assignOptional(result, 'icon', imageCode(item.item_icon))
  assignOptional(
    result,
    'description',
    text(item.item_description, `${path}.item_description`, context, false),
  )
  assignOptional(
    result,
    'shapeName',
    text(item.item_shape_name, `${path}.item_shape_name`, context, false),
  )
  assignOptional(result, 'shapeIcon', imageCode(item.item_shape_icon))
  assignOptional(
    result,
    'gender',
    text(item.item_gender, `${path}.item_gender`, context, false),
  )
  assignOptional(
    result,
    'potentialOptionGrade',
    mapGrade(
      item.potential_option_grade,
      `${path}.potential_option_grade`,
      context,
    ),
  )
  assignOptional(
    result,
    'additionalPotentialOptionGrade',
    mapGrade(
      item.additional_potential_option_grade,
      `${path}.additional_potential_option_grade`,
      context,
    ),
  )

  const numericKeys: Array<[keyof ItemEquipmentInfo, string]> = [
    ['equipmentLevelIncrease', 'equipment_level_increase'],
    ['growthExp', 'growth_exp'],
    ['growthLevel', 'growth_level'],
    ['scrollUpgrade', 'scroll_upgrade'],
    ['cuttableCount', 'cuttable_count'],
    ['scrollResilienceCount', 'scroll_resilience_count'],
    ['scrollUpgradeableCount', 'scroll_upgradeable_count'],
    ['starforce', 'starforce'],
    ['specialRingLevel', 'special_ring_level'],
  ]
  for (const [target, source] of numericKeys) {
    const value = number(item[source], `${path}.${source}`, context, false)
    if (value !== undefined) {
      ;(result as unknown as Record<string, unknown>)[target] = value
    }
  }

  const goldenHammerFlag =
    item.golden_hammer_flag === '적용'
      ? true
      : item.golden_hammer_flag === '미적용'
        ? false
        : undefined
  assignOptional(result, 'goldenHammerFlag', goldenHammerFlag)
  const starforceScrollFlag =
    item.starforce_scroll_flag === '사용'
      ? true
      : item.starforce_scroll_flag === '미사용'
        ? false
        : undefined
  assignOptional(result, 'starforceScrollFlag', starforceScrollFlag)
  assignOptional(
    result,
    'soulName',
    text(item.soul_name, `${path}.soul_name`, context, false),
  )
  assignOptional(
    result,
    'soulOption',
    text(item.soul_option, `${path}.soul_option`, context, false),
  )
  assignOptional(
    result,
    'dateExpire',
    isoDate(item.date_expire, `${path}.date_expire`, context),
  )
  assignOptional(
    result,
    'dateOptionExpire',
    isoDate(item.date_option_expire, `${path}.date_option_expire`, context),
  )

  const optionFields: Array<[keyof ItemEquipmentInfo, string]> = [
    ['totalOption', 'item_total_option'],
    ['baseOption', 'item_base_option'],
    ['exceptionalOption', 'item_exceptional_option'],
    ['addOption', 'item_add_option'],
    ['etcOption', 'item_etc_option'],
    ['starforceOption', 'item_starforce_option'],
  ]
  for (const [target, source] of optionFields) {
    const value = mapOption(item[source], `${path}.${source}`, context)
    if (value !== undefined) {
      ;(result as unknown as Record<string, unknown>)[target] = value
    }
  }

  return result
}

const titleAsItem = (raw: unknown): UnknownRecord[] => {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return []
  const title = raw as UnknownRecord
  if (!title.title_name) return []
  return [
    {
      item_equipment_part: '칭호',
      item_equipment_slot: '칭호',
      item_name: title.title_name,
      item_icon: title.title_icon,
      item_description: title.title_description,
      date_expire: title.date_expire,
      date_option_expire: title.date_option_expire,
    },
  ]
}

export const parseItemEquipment = (
  body: Uint8Array | string,
): ParseResult<ItemEquipmentPreset[]> => {
  const context = new ParseContext()
  const root = record(readJson(body, context), '$', context)
  if (!root) return context.failed()

  const requestedPreset = integer(root.preset_no, '$.preset_no', context, false)
  const activePreset =
    requestedPreset !== undefined &&
    requestedPreset >= 1 &&
    requestedPreset <= 3
      ? requestedPreset
      : 1
  if (
    requestedPreset !== undefined &&
    (requestedPreset < 1 || requestedPreset > 3)
  ) {
    context.unknown(
      '$.preset_no',
      '알 수 없는 장비 프리셋 번호입니다. 현재 착용 장비를 사용합니다.',
      root.preset_no,
    )
  }
  const presets: Array<{ presetNo: number; raw: unknown[] }> = [1, 2, 3].map(
    (presetNo) => ({
      presetNo,
      raw: array(
        root[`item_equipment_preset_${presetNo}`],
        `$.item_equipment_preset_${presetNo}`,
        context,
        false,
      ),
    }),
  )
  const active = presets.find((preset) => preset.presetNo === activePreset)!
  if (
    requestedPreset === undefined ||
    requestedPreset !== activePreset ||
    !Array.isArray(root[`item_equipment_preset_${activePreset}`])
  ) {
    active.raw = array(root.item_equipment, '$.item_equipment', context)
    if (requestedPreset !== undefined && requestedPreset === activePreset) {
      context.issue(
        `$.item_equipment_preset_${activePreset}`,
        'missing_required',
        '활성 프리셋이 없어 현재 착용 장비를 사용합니다.',
      )
    }
  }
  const title = titleAsItem(root.title)
  if (title.length > 0) presets.push({ presetNo: 4, raw: title })
  const special = [
    ...array(root.dragon_equipment, '$.dragon_equipment', context, false),
    ...array(root.mechanic_equipment, '$.mechanic_equipment', context, false),
  ]
  if (special.length > 0) presets.push({ presetNo: 5, raw: special })

  const result = presets.map(({ presetNo, raw }) => ({
    presetNo,
    active: activePreset === presetNo,
    itemEquipmentInfo: raw.flatMap((item, index) => {
      const mapped = mapItem(
        item,
        `$.item_equipment_preset_${presetNo}[${index}]`,
        context,
      )
      return mapped ? [mapped] : []
    }),
  }))
  return context.result(result)
}

const prismRanges: Record<string, string> = {
  '전체 색상 계열': 'ALL',
  '빨간색 계열': 'RED',
  '노란색 계열': 'YELLOW',
  '초록색 계열': 'GREEN',
  '청록색 계열': 'CYAN',
  '파란색 계열': 'BLUE',
  '자주색 계열': 'PURPLE',
}

const cashOptionKeys: Record<string, keyof ItemOption> = {
  STR: 'str',
  DEX: 'dex',
  INT: 'int',
  LUK: 'luk',
  '최대 HP': 'maxHp',
  '최대 MP': 'maxMp',
  공격력: 'attackPower',
  마력: 'magicPower',
  방어력: 'armor',
  이동속도: 'speed',
  점프력: 'jump',
}

const mapCashOptions = (raw: unknown, path: string, context: ParseContext) => {
  const result: ItemOption = {}
  array(raw, path, context, false).forEach((entry, index) => {
    const itemPath = `${path}[${index}]`
    const item = record(entry, itemPath, context)
    if (!item) return
    const optionType = text(
      item.option_type,
      `${itemPath}.option_type`,
      context,
    )
    const optionValue = number(
      item.option_value,
      `${itemPath}.option_value`,
      context,
    )
    if (!optionType || optionValue === undefined) return
    const key = cashOptionKeys[optionType]
    if (!key) {
      context.unknown(
        `${itemPath}.option_type`,
        `알 수 없는 캐시 옵션: ${optionType}`,
        optionType,
      )
      return
    }
    result[key] = optionValue
  })
  return Object.keys(result).length === 0 ? undefined : result
}

const mapCashItem = (
  raw: unknown,
  path: string,
  context: ParseContext,
): CashEquipmentPreset['cashEquipmentInfo'][number] | undefined => {
  const item = record(raw, path, context)
  if (!item) return undefined
  const part = text(
    item.cash_item_equipment_part,
    `${path}.cash_item_equipment_part`,
    context,
  )
  const slot = text(
    item.cash_item_equipment_slot,
    `${path}.cash_item_equipment_slot`,
    context,
  )
  const name = text(item.cash_item_name, `${path}.cash_item_name`, context)
  if (!part || !slot || !name) return undefined

  const result: CashEquipmentPreset['cashEquipmentInfo'][number] = {
    part,
    slot,
    name,
  }
  assignOptional(result, 'icon', imageCode(item.cash_item_icon))
  assignOptional(
    result,
    'description',
    text(
      item.cash_item_description,
      `${path}.cash_item_description`,
      context,
      false,
    ),
  )
  assignOptional(
    result,
    'dateExpire',
    isoDate(item.date_expire, `${path}.date_expire`, context),
  )
  assignOptional(
    result,
    'dateOptionExpire',
    isoDate(item.date_option_expire, `${path}.date_option_expire`, context),
  )
  assignOptional(
    result,
    'label',
    text(item.cash_item_label, `${path}.cash_item_label`, context, false),
  )
  assignOptional(
    result,
    'itemGender',
    text(item.item_gender, `${path}.item_gender`, context, false),
  )
  assignOptional(
    result,
    'option',
    mapCashOptions(item.cash_item_option, `${path}.cash_item_option`, context),
  )

  const prism =
    item.cash_item_coloring_prism === null ||
    item.cash_item_coloring_prism === undefined
      ? undefined
      : record(
          item.cash_item_coloring_prism,
          `${path}.cash_item_coloring_prism`,
          context,
        )
  if (prism) {
    const rawRange = text(
      prism.color_range,
      `${path}.cash_item_coloring_prism.color_range`,
      context,
      false,
    )
    if (rawRange) {
      const range = prismRanges[rawRange]
      if (!range)
        context.unknown(
          `${path}.cash_item_coloring_prism.color_range`,
          `알 수 없는 프리즘 범위: ${rawRange}`,
          rawRange,
        )
      result.coloringPrismRange = range ?? 'UNKNOWN'
    }
    assignOptional(
      result,
      'coloringPrismHue',
      number(prism.hue, `${path}.cash_item_coloring_prism.hue`, context, false),
    )
    assignOptional(
      result,
      'coloringPrismSaturation',
      number(
        prism.saturation,
        `${path}.cash_item_coloring_prism.saturation`,
        context,
        false,
      ),
    )
    assignOptional(
      result,
      'coloringPrismValue',
      number(
        prism.value,
        `${path}.cash_item_coloring_prism.value`,
        context,
        false,
      ),
    )
  }
  return result
}

export const parseCashEquipment = (
  body: Uint8Array | string,
): ParseResult<CashEquipmentPreset[]> => {
  const context = new ParseContext()
  const root = record(readJson(body, context), '$', context)
  if (!root) return context.failed()
  const basePreset = integer(root.preset_no, '$.preset_no', context, false) ?? 0
  const lookMode = text(
    root.character_look_mode,
    '$.character_look_mode',
    context,
    false,
  )
  const activePreset = basePreset + (lookMode === '1' ? 4 : 0)
  const keys = [
    ['cash_item_equipment_base', 0],
    ['cash_item_equipment_preset_1', 1],
    ['cash_item_equipment_preset_2', 2],
    ['cash_item_equipment_preset_3', 3],
    ['additional_cash_item_equipment_base', 4],
    ['additional_cash_item_equipment_preset_1', 5],
    ['additional_cash_item_equipment_preset_2', 6],
    ['additional_cash_item_equipment_preset_3', 7],
  ] as const
  const result: CashEquipmentPreset[] = []
  for (const [key, presetNo] of keys) {
    const items = array(root[key], `$.${key}`, context, false)
    if (items.length === 0) continue
    result.push({
      presetNo,
      active: presetNo === activePreset,
      cashEquipmentInfo: items.flatMap((item, index) => {
        const mapped = mapCashItem(item, `$.${key}[${index}]`, context)
        return mapped ? [mapped] : []
      }),
    })
  }
  return context.result(result)
}
