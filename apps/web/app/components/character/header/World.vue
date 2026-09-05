<template>
  <div class="font-light text-lucidviolet-700">
    <span class="font-thin text-lucidviolet-400"> 서버는 역시 </span>
    {{ character?.worldName }}
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  character: Character | undefined
}>()

const { character } = toRefs(props)
</script>
