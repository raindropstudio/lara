<template>
  <div class="font-thin text-lucidviolet-500">
    나는야
    <span class="font-extrabold text-sunnyorange">{{ character?.class }}</span>
    그 자체
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  character: Character | undefined
}>()

const { character } = toRefs(props)
</script>
