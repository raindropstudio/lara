import { array, integer, readJson, record, text } from './read.js'
import { ParseContext, type ParseResult } from './result.js'
import type { Ability, AbilityGrade } from './types.js'

const abilityGrades: Record<string, AbilityGrade> = {
  레전드리: 'LEGENDARY',
  유니크: 'UNIQUE',
  에픽: 'EPIC',
  레어: 'RARE',
  노멀: 'NORMAL',
}

export const parseAbility = (
  body: Uint8Array | string,
): ParseResult<Ability> => {
  const context = new ParseContext()
  const root = record(readJson(body, context), '$', context)
  if (!root) return context.failed()

  const remainFame = integer(root.remain_fame, '$.remain_fame', context)
  if (remainFame === undefined) return context.failed()

  const activePreset = integer(root.preset_no, '$.preset_no', context, false)
  const preset: Ability['preset'] = []

  for (const presetNo of [1, 2, 3]) {
    const presetPath = `$.ability_preset_${presetNo}`
    const presetRoot = record(
      root[`ability_preset_${presetNo}`],
      presetPath,
      context,
    )
    const rawAbilities =
      presetNo === 1 && activePreset === undefined
        ? array(root.ability_info, '$.ability_info', context, false)
        : presetRoot
          ? array(
              presetRoot.ability_info,
              `${presetPath}.ability_info`,
              context,
              false,
            )
          : []

    if (rawAbilities.length === 0 && !presetRoot) continue
    const abilityInfo: Ability['preset'][number]['abilityInfo'] = []
    rawAbilities.forEach((raw, index) => {
      const path = `${presetPath}.ability_info[${index}]`
      const item = record(raw, path, context)
      if (!item) return
      const abilityNo = integer(item.ability_no, `${path}.ability_no`, context)
      const rawGrade = text(
        item.ability_grade,
        `${path}.ability_grade`,
        context,
      )
      const abilityValue = text(
        item.ability_value,
        `${path}.ability_value`,
        context,
      )
      if (abilityNo === undefined || !rawGrade || !abilityValue) return
      const abilityGrade = abilityGrades[rawGrade] ?? 'UNKNOWN'
      if (abilityGrade === 'UNKNOWN')
        context.unknown(
          `${path}.ability_grade`,
          `알 수 없는 ability 등급: ${rawGrade}`,
          rawGrade,
        )
      abilityInfo.push({ abilityNo, abilityGrade, abilityValue })
    })
    preset.push({
      presetNo,
      active:
        activePreset === undefined ? presetNo === 1 : activePreset === presetNo,
      abilityInfo,
    })
  }

  return context.result({ remainFame, preset })
}
