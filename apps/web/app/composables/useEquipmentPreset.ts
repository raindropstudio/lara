import type { Character } from '~/types/character.type'
import { activeEquipmentPreset, equipmentForPreset } from '~/utils/equipment'

export const useEquipmentPreset = (character: Ref<Character | undefined>) => {
  const presets = computed(() => character.value?.itemEquipmentPreset ?? [])
  const active = computed(() => activeEquipmentPreset(presets.value))
  const selected = ref(1)
  watch(
    () => active.value?.presetNo,
    (value) => {
      selected.value = value ?? 1
    },
    { immediate: true },
  )
  const items = computed(() =>
    equipmentForPreset(presets.value, selected.value),
  )
  return { presets, active, selected, items }
}
