<template>
  <div
    ref="popupRef"
    class="relative inline-block"
    @mouseenter="visible = true"
    @mouseleave="visible = false"
  >
    <slot />
    <div
      v-if="visible"
      ref="popupFloating"
      :style="floatingStyles"
      class="pointer-events-none absolute z-30 overflow-visible whitespace-pre rounded-md bg-white px-2 py-1 text-sm font-light text-lucidviolet-900 ring-1 ring-lucidgray-light"
    >
      <slot name="tooltip" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { autoUpdate, flip, offset, useFloating } from '@floating-ui/vue'

const visible = ref(false)

const popupRef = ref<HTMLElement | null>(null)
const popupFloating = ref<HTMLElement | null>(null)
const { floatingStyles } = useFloating(popupRef, popupFloating, {
  whileElementsMounted: autoUpdate,
  placement: 'top',
  middleware: [offset(2), flip()],
})
</script>
