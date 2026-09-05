<template>
  <PresetCard
    point-label="남은 포인트"
    :remain-point="selectedPreset?.remainPoint ?? 0"
    :selected-preset-no="selectedPresetNo"
    :is-active-preset="
      (presetNo: number) =>
        hyperStatPreset.find((p) => p.presetNo === presetNo)?.active ?? false
    "
    @update:selected-preset-no="selectedPresetNo = $event"
  >
    <template #preset-info>
      <div class="flex flex-col">
        <div
          v-for="stat in selectedPreset?.hyperStatInfo"
          :key="stat.statType"
          class="flex items-center"
        >
          <span class="mr-1 w-12 text-base font-bold text-lucidviolet-700"
            >Lv. {{ stat.statLevel }}</span
          >
          <span class="flex-1 text-sm text-lucidviolet-900">{{
            formatStatIncrease(stat.statIncrease)
          }}</span>
        </div>
      </div>
    </template>
  </PresetCard>
</template>

<script setup lang="ts">
import PresetCard from '~/components/character/stat/PresetCard.vue'

const props = defineProps<{
  hyperStatPreset: HyperStatPreset[]
}>()

const activePreset = computed(() =>
  props.hyperStatPreset.find((preset) => preset.active),
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

const selectedPreset = computed(() => {
  const preset = props.hyperStatPreset.find(
    (preset) => preset.presetNo === selectedPresetNo.value,
  )
  preset?.hyperStatInfo?.sort((a, b) => b.statLevel - a.statLevel)
  return preset
})

// statIncrease 포맷팅 함수 (공격력과 마력이라고 API에서 반환됨.)
const formatStatIncrease = (statIncrease: string) => {
  return statIncrease
    .replace('공격력과 마력', '공격력/마력')
    .replace('데몬 포스/타임 포스', 'DF/TF')
    .replace(' 증가 최대', ', ')
    .replace('싸이킥 포인트', 'PP')
}
</script>
