import type { ItemEquipmentPreset } from '~/types/itemEquipment.type'

export const activeEquipmentPreset = (presets: ItemEquipmentPreset[] = []) =>
  presets.find((preset) => preset.active && preset.presetNo <= 3) ??
  presets.find((preset) => preset.presetNo >= 1 && preset.presetNo <= 3)

export const equipmentForPreset = (
  presets: ItemEquipmentPreset[] = [],
  presetNo?: number,
) => [
  ...(presets.find(
    (preset) =>
      preset.presetNo ===
      (presetNo ?? activeEquipmentPreset(presets)?.presetNo),
  )?.itemEquipmentInfo ?? []),
  ...presets
    .filter((preset) => preset.presetNo === 4 || preset.presetNo === 5)
    .flatMap((preset) => preset.itemEquipmentInfo),
]
