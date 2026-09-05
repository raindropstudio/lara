<template>
  <div>
    <UiTooltip>
      <div
        class="cursor-help bg-gradient-to-r from-lucid-light via-20% to-black to-70% bg-clip-text font-semibold text-transparent"
        :class="typeof liberation === 'object' ? liberation.class : ''"
      >
        {{ liberation.text }}
      </div>
      <template #tooltip>
        <div>
          {{ liberation.tooltip }}
        </div>
      </template>
    </UiTooltip>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  character: Character | undefined
}>()

const { character } = toRefs(props)

// 프리셋 무기중 제네시스인지 데스티니인지 확인
const isDestiny = computed(() => {
  if (!character.value) return false
  return character.value.itemEquipmentPreset.some((equip) =>
    equip.itemEquipmentInfo.some(
      (item) => item.slot === '무기' && item.name.startsWith('데스티니'),
    ),
  )
})

// 제네시스 무기 해방여부멘트
const liberation = computed(() => {
  if (!character.value) return { text: '', class: '', tooltip: '' }
  if (isDestiny.value)
    return {
      text: '데스티니 무기의 주인',
      class: 'via-blue-700',
      tooltip: '데스티니 무기 해방 완료',
    }
  if (character.value.liberationQuestClear)
    return {
      text: '제네시스 무기의 주인',
      class: 'via-red-700',
      tooltip: '제네시스 무기 해방 완료',
    }
  if (character.value.level < 200)
    return {
      text: '성장의 길 위에 선',
      class: 'via-green-700',
      tooltip: '제네시스 무기 해방 미완료',
    }
  return {
    text: '검은마법사의 대적자',
    class: 'via-red-700',
    tooltip: '제네시스 무기 해방 미완료',
  }
})
</script>
