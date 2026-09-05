<template>
  <form class="w-full" @submit.prevent="$emit('submit')">
    <div class="flex w-full items-center gap-2 sm:gap-4">
      <input
        :id="id"
        v-model="model"
        :aria-label="label"
        :aria-describedby="describedby"
        :aria-invalid="invalid || undefined"
        :placeholder="placeholder"
        autocomplete="off"
        spellcheck="false"
        class="min-w-0 flex-1 border-0 border-b-2 border-lucidviolet-300 bg-transparent px-0 py-3 text-center text-4xl font-bold tracking-tight text-lucidviolet-600 caret-sunnyorange placeholder:text-lucidviolet-300 focus:border-sunnyorange focus:ring-0 sm:text-6xl lg:text-7xl"
      />
      <button
        type="submit"
        :aria-label="label"
        class="flex size-12 shrink-0 items-center justify-center rounded-lg text-lucidviolet-400 hover:bg-lucidviolet-50 hover:text-sunnyorange sm:size-16"
      >
        <IconRightArrow class="size-10 sm:size-14" />
      </button>
    </div>
    <slot />
  </form>
</template>
<script setup lang="ts">
const model = defineModel<string>({ required: true })
defineProps<{
  id?: string
  label: string
  placeholder: string
  describedby?: string
  invalid?: boolean
}>()
defineEmits<{ submit: [] }>()
</script>
