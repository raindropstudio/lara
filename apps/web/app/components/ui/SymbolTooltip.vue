<template>
  <div
    ref="popupRef"
    class="relative inline-block"
    @mouseenter="visible = true"
    @mouseleave="visible = false"
  >
    <slot />
    <div
      v-if="visible && symbol"
      ref="popupFloating"
      :style="floatingStyles"
      class="pointer-events-none absolute left-0 top-0 z-30 w-64 overflow-visible rounded-md bg-white/50 p-2 text-xs font-light text-lucidviolet-900 ring-2 ring-lucidgray-light backdrop-blur-2xl"
    >
      <!-- 심볼 이름 -->
      <div class="py-1 text-center text-lg font-bold">
        {{ symbol.name }}
      </div>

      <!-- 점선 구분선 -->
      <hr class="my-2 border-t border-dashed border-gray-200" />

      <!-- 포스와 레벨 정보 -->
      <div class="flex items-center gap-2">
        <div
          class="flex size-16 items-center justify-center rounded-md border-2 border-lucidgray-medium bg-gray-50"
        >
          <img
            :src="symbolImage"
            alt="symbol.name"
            class="size-10 object-contain [image-rendering:pixelated]"
          />
        </div>
        <div class="flex flex-col">
          <span class="font-medium">성장 레벨 : {{ symbol.level }}</span>
          <span
            v-if="
              (symbol.name.startsWith('아케인') && symbol.level !== 20) ||
              ((symbol.name.startsWith('어센틱') ||
                symbol.name.startsWith('그랜드 어센틱')) &&
                symbol.level !== 11)
            "
          >
            성장치 : {{ symbol.growthCount }} /
            {{ symbol.requireGrowthCount }} ({{
              Math.min(
                Math.floor(
                  (symbol.growthCount / symbol.requireGrowthCount) * 100,
                ),
                100,
              )
            }}%)
          </span>
          <span v-else> 성장치 : MAX </span>
          <span class="text-lucidviolet-700">
            누적 : {{ symbolProgress.accCount }} /
            {{ symbolProgress.totalRequire }} ({{
              symbolProgress.progressPercent.toFixed(0)
            }}%)
          </span>
        </div>
      </div>

      <!-- 점선 구분선 -->
      <hr class="my-2 border-t border-dashed border-gray-200" />

      <!-- 스탯 정보 -->
      <div class="mt-2 font-medium">
        <div v-if="symbol.str">STR : +{{ symbol.str }}</div>
        <div v-if="symbol.dex">DEX : +{{ symbol.dex }}</div>
        <div v-if="symbol.int">INT : +{{ symbol.int }}</div>
        <div v-if="symbol.luk">LUK : +{{ symbol.luk }}</div>
        <div v-if="symbol.hp">HP : +{{ symbol.hp }}</div>
        <div v-if="symbol.expRate">경험치 획득량 : +{{ symbol.expRate }}%</div>
        <div v-if="symbol.mesoRate">메소 획득량 : +{{ symbol.mesoRate }}%</div>
        <div v-if="symbol.dropRate">
          아이템 드롭률 : +{{ symbol.dropRate }}%
        </div>
        <div>
          {{ symbol.name.startsWith('아케인') ? 'ARC' : 'AUT' }} : +{{
            symbol.force
          }}
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  autoUpdate,
  limitShift,
  offset,
  shift,
  useFloating,
} from '@floating-ui/vue'
import type { Symbol } from '~/types/symbol.type'

const props = defineProps<{
  symbol: Symbol | undefined
}>()

const { symbol } = toRefs(props)
const visible = ref(false)

const popupRef = ref<HTMLElement | null>(null)
const popupFloating = ref<HTMLElement | null>(null)
const { floatingStyles } = useFloating(popupRef, popupFloating, {
  whileElementsMounted: autoUpdate,
  placement: 'right-start',
  middleware: [
    offset(10),
    shift({
      crossAxis: true,
      limiter: limitShift(),
    }),
  ],
})
const symbolImage = await getSymbolImageUrl(symbol.value?.name)

const symbolProgress = computed(() => {
  if (!symbol.value) {
    return {
      accCount: 0,
      totalRequire: 0,
      progressPercent: 0,
    }
  }
  if (symbol.value?.name.startsWith('아케인')) {
    return getArcaneProgress(symbol.value)
  }
  return getAuthenticProgress(symbol.value)
})
</script>
