<template>
  <CharacterStatPresetCard
    point-label="명성치"
    :remain-point="ability.remainFame"
    :selected-preset-no="selectedPresetNo"
    :is-active-preset="
      (presetNo: number) =>
        ability.preset.find((p) => p.presetNo === presetNo)?.active ?? false
    "
    @update:selected-preset-no="selectedPresetNo = $event"
  >
    <template #preset-info>
      <div class="flex flex-col gap-1">
        <div
          v-for="abilityInfo in selectedPreset?.abilityInfo"
          :key="abilityInfo.abilityNo"
          class="flex items-center gap-2"
        >
          <div
            class="h-4 w-1 rounded-full"
            :class="getAbilityBackgroundColor(abilityInfo.abilityGrade)"
          />
          <span class="text-sm text-lucidviolet-900">{{
            abilityInfo.abilityValue
          }}</span>
        </div>
      </div>
    </template>
  </CharacterStatPresetCard>
</template>

<script setup lang="ts">
const props = defineProps<{
  ability: Ability
}>()

const activePreset = computed(() =>
  props.ability.preset.find((preset) => preset.active),
)

const selectedPresetNo = ref(activePreset.value?.presetNo ?? 1)

watch(
  activePreset,
  (newValue) => {
    if (newValue?.presetNo !== undefined) {
      selectedPresetNo.value = newValue.presetNo
    }
  },
  { immediate: true },
)

const selectedPreset = computed(() =>
  props.ability.preset.find(
    (preset) => preset.presetNo === selectedPresetNo.value,
  ),
)

const getAbilityBackgroundColor = (grade: AbilityGrade) => {
  switch (grade) {
    case 'LEGENDARY':
      return 'bg-potential-legendary'
    case 'UNIQUE':
      return 'bg-potential-unique'
    case 'EPIC':
      return 'bg-potential-epic'
    case 'RARE':
      return 'bg-potential-rare'
    default:
      return 'bg-potential-normal'
  }
}
</script>
