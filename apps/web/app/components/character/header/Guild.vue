<template>
  <div class="font-medium text-lucidviolet-500">
    <div v-if="character?.guildName">
      <span class="font-extralight text-lucidviolet-400">우리길드</span>
      {{ character?.guildName }}
      <span class="font-thin text-lucidviolet-400"> 화이팅!! </span>
    </div>
    <div v-else>
      <UiTooltip>
        <span class="cursor-help font-extralight text-lucidviolet-400"
          >자유로운 영혼</span
        >
        <template #tooltip>
          <div>가입 길드 없음</div>
        </template>
      </UiTooltip>
    </div>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  character: Character | undefined
}>()

const { character } = toRefs(props)
</script>
