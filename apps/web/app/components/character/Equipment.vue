<template>
  <div>
    <div class="flex flex-col py-12">
      <UiSectionTitle> Equipment </UiSectionTitle>
      <div class="my-12 flex flex-wrap items-center justify-evenly gap-y-24">
        <div
          class="flex w-full max-w-full flex-col gap-4 overflow-x-auto px-4 sm:w-auto"
        >
          <HTransitionRoot
            :show="viewMode === 'icon'"
            enter="transition-all duration-300 ease-in-out"
            enter-from="opacity-0 w-[563px] h-[492px]"
            enter-to="opacity-100 w-[304px] h-[368px]"
          >
            <CharacterEquipmentIconView
              v-if="viewMode === 'icon'"
              :view-preset="viewPreset"
            />
          </HTransitionRoot>
          <HTransitionRoot
            :show="viewMode === 'card'"
            enter="transition-all duration-300 ease-in-out"
            enter-from="opacity-0 w-[304px] max-h-[368px]"
            enter-to="opacity-100 w-[563px] max-h-[492px]"
            entered="min-w-[563px]"
          >
            <CharacterEquipmentCardView
              v-if="viewMode === 'card'"
              :view-preset="viewPreset"
              :main-stat-name="mainStatName"
              :atk-stat="atkStat"
            />
          </HTransitionRoot>
          <div
            class="flex justify-between gap-4 rounded bg-gray-50 p-1 text-sm text-lucidgray-dark outline outline-lucidgray-medium"
          >
            <div class="flex">
              <button
                class="flex items-center gap-1 rounded px-1 hover:bg-lucidviolet-100"
                :class="{
                  'bg-lucidviolet-50 font-semibold text-lucidviolet-700':
                    viewMode === 'icon',
                }"
                @click="viewMode = 'icon'"
              >
                <IconViewIcon class="size-4" />
                <span>아이콘</span>
              </button>
              <button
                class="flex items-center gap-1 rounded px-1 hover:bg-lucidviolet-100"
                :class="{
                  'bg-lucidviolet-50 font-semibold text-lucidviolet-700':
                    viewMode === 'card',
                }"
                @click="viewMode = 'card'"
              >
                <IconViewCard class="size-4" />
                <span>카드</span>
              </button>
            </div>
            <div class="flex gap-1">
              <template v-for="presetNo in [1, 2, 3]" :key="presetNo">
                <button
                  class="size-5 rounded hover:bg-lucidviolet-100"
                  :class="{
                    'bg-lucidviolet-100 font-semibold text-lucidviolet-700':
                      selected === presetNo,
                    underline: active?.presetNo === presetNo,
                  }"
                  @click="selected = presetNo"
                >
                  {{ presetNo }}
                </button>
              </template>
            </div>
          </div>
        </div>
        <div class="flex max-w-full flex-col overflow-x-auto px-4">
          <div class="mb-8 flex flex-col">
            <div class="mb-4 flex items-end gap-2">
              <div class="text-5xl font-extrabold text-lucidgray-light">
                세트 효과
              </div>
              <span
                v-if="active !== undefined"
                class="text-sm font-light text-lucidgray-dark"
                >프리셋 {{ active?.presetNo }} 기준</span
              >
            </div>
            <div class="mx-auto">
              <CharacterEquipmentSetEffect
                :active-preset="activePreset"
                :set-effect="character?.setEffect ?? []"
              />
            </div>
          </div>
          <div class="flex flex-col">
            <div class="mb-4 text-5xl font-extrabold text-lucidgray-light">
              아이템 요약
            </div>
            <div class="mx-auto">
              <CharacterEquipmentItemSummary
                :view-preset="viewPreset"
                :main-stat-name="mainStatName"
                :atk-stat="atkStat"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  character: Character | undefined
}>()

const character = toRef(props, 'character')
const { active, selected, items: viewPreset } = useEquipmentPreset(character)
const activePreset = computed(() => active.value?.itemEquipmentInfo)
const viewMode = ref<'icon' | 'card'>('icon')
const mainStatName = computed(
  () => findMainStat(character.value)?.toUpperCase() ?? 'ERR',
)
const atkStat = computed(() =>
  mainStatName.value === 'INT' ? '마력' : '공격력',
)
</script>
