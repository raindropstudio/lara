<template>
  <div
    class="flex flex-wrap items-center justify-around gap-y-8 lg:flex-nowrap lg:justify-between"
  >
    <div
      class="order-2 flex w-28 flex-col items-center justify-center lg:order-none"
    >
      <div class="text-base font-normal text-gray-500">유니온</div>
      <div class="text-3xl font-bold text-lucid-violetgray">
        {{ character?.union?.unionLevel ?? '-' }}
      </div>
    </div>
    <div
      class="order-3 flex w-28 flex-col items-center justify-center lg:order-none"
    >
      <div class="text-base font-normal text-gray-500">레벨</div>
      <div class="text-3xl font-bold text-lucid-violetgray">
        {{ character?.level }}.{{
          character?.expRate.toFixed(0).padStart(2, '0')
        }}
      </div>
    </div>
    <div
      class="order-1 flex w-full flex-col items-center justify-center lg:order-none lg:mb-0 lg:w-auto"
    >
      <div class="text-lg font-normal text-gray-500">전투력</div>
      <div
        class="bg-gradient-to-r from-[#FF4D00] to-[#EB00FF] bg-clip-text text-5xl font-bold text-transparent"
      >
        {{ combatPower }}
      </div>
    </div>
    <div
      class="order-4 flex w-28 flex-col items-center justify-center lg:order-none"
    >
      <div
        class="inline-flex items-center text-base font-normal text-lucidgray-dark"
      >
        {{ mainStat.label }}
        <UiTooltip v-if="mainStat.label === 'MIX'">
          <IconInfo class="-mr-4 size-4 text-lucidgray-medium" />
          <template #tooltip>
            <div>
              STR, DEX, LUK 합의 66%로 계산한 값이에요.
              <div class="font-medium text-lucidviolet-700">
                STR: {{ character?.stat?.str }} | DEX:
                {{ character?.stat?.dex }} | LUK: {{ character?.stat?.luk }}
              </div>
            </div>
          </template>
        </UiTooltip>
      </div>
      <div class="text-3xl font-bold text-lucid-violetgray">
        {{ mainStat.value ?? '—' }}
      </div>
    </div>
    <div
      class="order-5 flex w-28 flex-col items-center justify-center lg:order-none"
    >
      <div class="text-base font-normal text-gray-500">헥사 강화</div>
      <div class="text-3xl font-bold text-lucid-violetgray">
        {{
          character?.dataState.sections?.hexaMatrix?.status === 'complete'
            ? `${((hexaProgress.currentErdaPiece / hexaProgress.totalErdaPiece) * 100).toFixed(2)}%`
            : '—'
        }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  character: Character | undefined
}>()

const character = toRef(props, 'character')

const combatPower = computed(() => {
  const combat = character.value?.stat?.combatPower

  // 123456789 => 1억 2345만 6789
  return combat === undefined ? '—' : formatToKoreanNumber(combat)
})

const mainStat = computed(() => getMainStatSummary(character.value))

const hexaProgress = computed(() => {
  return getHexaProgress(character.value)
})
</script>
