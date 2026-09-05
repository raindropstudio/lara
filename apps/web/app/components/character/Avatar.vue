<template>
  <img
    :src="source"
    :alt="nickname"
    class="object-contain [image-rendering:pixelated]"
    draggable="false"
    @error="failed = true"
  />
</template>
<script setup lang="ts">
import fallback from '~/assets/spirit/ssun_logo.webp'
const props = defineProps<{ imageUrl?: string; nickname: string }>()
const failed = ref(false)
watch(
  () => props.imageUrl,
  () => {
    failed.value = false
  },
)
const source = computed(() =>
  !props.imageUrl || failed.value
    ? fallback
    : getCharacterImageUrl(props.imageUrl),
)
</script>
