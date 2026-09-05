<template>
  <div class="font-normal text-lucidviolet-700">
    <span class="font-thin text-lucidviolet-500">
      {{ popularityText }}
    </span>
    {{ character?.popularity }}
    <div class="-ms-3 inline-block text-4xl font-normal text-lucidviolet-300">
      <div v-if="(character?.popularity ?? 0) >= 0">
        <IconThumbsUp class="size-9" />
      </div>
      <div v-else>
        <IconThumbsDown class="size-9" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  character: Character | undefined
}>()

const character = toRef(props, 'character')

// 캐릭터 인기도 멘트
const popularityText = computed(() => {
  if (!character.value) return ''
  if (character.value.popularity >= 99999) return '메이플의 슈퍼스타'
  if (character.value.popularity >= 50000) return '메이플 셀러브리티'
  if (character.value.popularity >= 10000) return '메이플의 아이돌'
  if (character.value.popularity >= 5000) return '메이플 라이징스타'
  if (character.value.popularity >= 1000) return '메이플의 인기인'
  if (character.value.popularity >= 500) return '걸어다니는 좋아요'
  if (character.value.popularity >= 100) return '모두가 좋아하는'
  if (character.value.popularity >= 10) return '좋아요 수집가'
  if (character.value.popularity >= 2) return '작은 인기인'
  if (character.value.popularity === 1) return '친구가 눌러준'
  if (character.value.popularity === 0) return '중립적인 사람'
  if (character.value.popularity === -1) return '실수로 비추누른'
  if (character.value.popularity <= -99999) return '어둠의 슈퍼스타'
  return '싫어요'
})
</script>
