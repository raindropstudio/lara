<template>
  <div
    class="bg-gradient-to-r from-lucid-light to-lucidviolet-500 to-10% bg-clip-text font-light text-transparent"
  >
    <span>#</span>
    <UiTooltip>
      <span class="inline-block cursor-help text-lucidviolet-500">
        {{ character?.accessFlag ? '성실한' : '여유로운' }}
      </span>
      <template #tooltip>
        <div>
          {{
            character?.accessFlag ? '최근 7일 내 접속' : '최근 7일 내 미접속'
          }}
        </div>
      </template>
    </UiTooltip>
    <span class="font-thin">&nbsp;{{ genderText }} 모험가</span>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  character: Character | undefined
}>()

const { character } = toRefs(props)

// 성별 텍스트
const genderText = computed(() => {
  if (!character.value) return ''
  if (character.value.gender === '남') return '소년'
  if (character.value.gender === '여') return '소녀'
  if (character.value.gender === '기타') return '쌍둥이' // 제로
  return ''
})
</script>
