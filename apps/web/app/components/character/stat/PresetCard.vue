<template>
  <div class="flex flex-col gap-2">
    <!-- 현재 선택된 프리셋의 정보 (윗쪽 박스) -->
    <div
      class="rounded-lg bg-lucid-light p-3 shadow-md outline outline-lucidgray-light"
    >
      <slot name="preset-info" />
    </div>

    <!-- 포인트와 프리셋 선택 (아랫쪽 프리셋 선택 박스) -->
    <div
      class="flex justify-between gap-4 rounded bg-lucid-light p-1 text-sm text-lucidgray-dark outline outline-lucidgray-medium"
    >
      <div class="flex items-center gap-1 px-1">
        <span class="text-sm">{{ pointLabel }}</span>
        <span class="text-lucidviolet-800">{{
          remainPoint?.toLocaleString()
        }}</span>
      </div>
      <div class="flex gap-1">
        <template v-for="presetNo in [1, 2, 3]" :key="presetNo">
          <button
            class="size-5 rounded hover:bg-lucidviolet-100"
            :class="{
              'bg-lucidviolet-50 font-semibold text-lucidviolet-700':
                selectedPresetNo === presetNo,
              underline: isActivePreset(presetNo),
            }"
            @click="$emit('update:selectedPresetNo', presetNo)"
          >
            {{ presetNo }}
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  pointLabel: string
  remainPoint: number
  selectedPresetNo: number
  isActivePreset: (presetNo: number) => boolean
}>()

defineEmits<{
  'update:selectedPresetNo': [presetNo: number]
}>()
</script>
