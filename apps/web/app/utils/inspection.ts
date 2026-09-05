import { getMainStatSummary as inspectionMainStat } from './getMainStatSummary'
import type { Character } from '~/types/character.type'
import type { Stat } from '~/types/stat.type'
import { equipmentForPreset } from './equipment'
export { getMainStatSummary as inspectionMainStat } from './getMainStatSummary'

export const INSPECTION_LIMIT = 6

export const parseInspectionNames = (input: string) => [
  ...new Set(
    input
      .normalize('NFC')
      .split(/[\s,，]+/)
      .map((name) => name.trim())
      .filter(Boolean),
  ),
]

export const inspectionStats: {
  key: keyof Stat
  label: string
  unit?: string
}[] = [
  { key: 'combatPower', label: '전투력' },
  { key: 'bossMonsterDamage', label: '보스 데미지', unit: '%' },
  { key: 'ignoreDefenseRate', label: '방어율 무시', unit: '%' },
  { key: 'criticalRate', label: '크리티컬 확률', unit: '%' },
  { key: 'criticalDamage', label: '크리티컬 데미지', unit: '%' },
  { key: 'starForce', label: '스타포스' },
  { key: 'arcaneForce', label: '아케인포스' },
  { key: 'authenticForce', label: '어센틱포스' },
]

export const inspectionEquipmentSlots = [
  '무기',
  '보조무기',
  '엠블렘',
  '모자',
  '상의',
  '하의',
  '한벌옷',
  '장갑',
  '신발',
  '망토',
  '반지1',
  '반지2',
  '반지3',
  '반지4',
  '펜던트',
  '펜던트2',
  '얼굴장식',
  '눈장식',
  '귀고리',
  '벨트',
  '어깨장식',
  '뱃지',
  '훈장',
  '칭호',
  '기계 심장',
]

export const inspectionEquipment = (character?: Character) =>
  equipmentForPreset(character?.itemEquipmentPreset)
export const comparisonMaximum = (values: (number | undefined)[]) => {
  const known = values.filter(
    (value): value is number => value !== undefined && Number.isFinite(value),
  )
  return known.length > 1 ? Math.max(...known) : undefined
}
export const formatInspectionNumber = (value?: number, unit = '') =>
  value === undefined || !Number.isFinite(value)
    ? '—'
    : `${value.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}${unit}`

export const shouldRefreshInspection = (
  updatedAt: string,
  now = Date.now(),
) => {
  const updated = Date.parse(updatedAt)
  if (!Number.isFinite(updated)) return true
  const kstDay = (value: number) =>
    Math.floor((value + 9 * 60 * 60 * 1000) / 86_400_000)
  return kstDay(updated) < kstDay(now)
}

export const inspectionNotices = (character?: Character, now = Date.now()) => {
  if (!character) return []
  const notices: { label: string; warning: boolean }[] = []
  const equipmentState = character.dataState.sections?.itemEquipment
  const items = inspectionEquipment(character)
  if (
    equipmentState?.status === 'complete' &&
    !equipmentState.stale &&
    !items.some((item) => (item.specialRingLevel ?? 0) > 0)
  )
    notices.push({ label: '현재 프리셋에 시드링 없음', warning: true })
  for (const item of items) {
    if (
      (item.dateExpire && Date.parse(item.dateExpire) <= now) ||
      (item.dateOptionExpire && Date.parse(item.dateOptionExpire) <= now)
    )
      notices.push({ label: `${item.name} 기간 만료`, warning: true })
  }
  for (const item of character.cashEquipmentPreset
    .filter((preset) => preset.active)
    .flatMap((preset) => preset.cashEquipmentInfo)) {
    if (item.dateOptionExpire && Date.parse(item.dateOptionExpire) <= now)
      notices.push({ label: `${item.name} 전투복 옵션 만료`, warning: true })
  }
  if (!character.guildName)
    notices.push({ label: '가입한 길드 없음', warning: false })
  return notices
}

export const inspectionDetails = (
  character?: Character,
): { label: string; value: string }[] => {
  if (!character) return []
  const preset = (value?: number) =>
    value === undefined ? '—' : `프리셋 ${value}`
  const v = character.skillCore.filter((core) => core.skillCore.grade === 5)
  const hexa = character.skillCore.filter(
    (core) =>
      core.skillCore.grade === 6 &&
      !core.skillCore.coreName.includes('솔 야누스'),
  )
  const special = v
    .filter((core) => core.skillCore.coreType === '특수코어')
    .map((core) => core.skillCore.coreName)
  const link = character.linkSkill.find((preset) => preset.presetNo === 0)
  return [
    {
      label: '주스탯',
      value: `${inspectionMainStat(character).label} ${formatInspectionNumber(inspectionMainStat(character).value)}`,
    },
    {
      label: '장비',
      value: preset(
        character.itemEquipmentPreset.find((preset) => preset.active)?.presetNo,
      ),
    },
    {
      label: '어빌리티',
      value: preset(
        character.ability?.preset.find((preset) => preset.active)?.presetNo,
      ),
    },
    {
      label: '하이퍼스탯',
      value: preset(
        character.hyperStatPreset?.find((preset) => preset.active)?.presetNo,
      ),
    },
    {
      label: '시드링',
      value:
        inspectionEquipment(character)
          .filter((item) => (item.specialRingLevel ?? 0) > 0)
          .map((item) => `${item.name} Lv.${item.specialRingLevel}`)
          .join(', ') || '—',
    },
    { label: 'V 코어', value: v.length ? `${v.length}개 장착` : '—' },
    { label: '특수 코어', value: special.join(', ') || '—' },
    {
      label: 'HEXA 코어',
      value: hexa.length
        ? `${hexa.length}개 · 코어 레벨 합 ${hexa.reduce((sum, core) => sum + core.coreLevel, 0)} (솔 야누스 제외)`
        : '—',
    },
    {
      label: '링크스킬',
      value: link
        ? link.skill
            .map((skill) => `${skill.name} Lv.${skill.level}`)
            .join(', ') || '장착 없음'
        : '—',
    },
  ]
}
