<template>
  <div>
    <div class="flex flex-col py-12">
      <div class="text-8xl font-black text-lucidgray-light">Equipment</div>
      <div class="my-12 flex flex-wrap items-center justify-evenly gap-y-24">
        <div class="flex flex-col gap-4 px-4">
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
                      viewPresetIdx === presetNo - 1,
                    underline: activePresetIdx === presetNo - 1,
                  }"
                  @click="viewPresetIdx = presetNo - 1"
                >
                  {{ presetNo }}
                </button>
              </template>
            </div>
          </div>
        </div>
        <div class="flex flex-col px-4">
          <div class="mb-8 flex flex-col">
            <div class="mb-4 flex items-end gap-2">
              <div class="text-5xl font-extrabold text-lucidgray-light">
                세트 효과
              </div>
              <span
                v-if="activePresetIdx !== undefined"
                class="text-sm font-light text-lucidgray-dark"
                >프리셋 {{ activePresetIdx + 1 }} 기준</span
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
const equipPreset = computed(() => character.value?.itemEquipmentPreset)
const activePresetIdx = computed(() =>
  equipPreset.value?.findIndex((equip) => equip.active),
)
const viewPresetIdx = ref(activePresetIdx.value)
const viewMode = ref<'icon' | 'card'>('icon')

watch(
  activePresetIdx,
  (newValue) => {
    if (newValue !== undefined) {
      viewPresetIdx.value = newValue
    }
  },
  { immediate: true },
)

const activePreset = computed(
  () => equipPreset.value?.[activePresetIdx.value ?? 0]?.itemEquipmentInfo,
)

const viewPreset = computed(() => {
  // 백엔드 converter에서 프리셋 순서대로 보내주도록 보장함
  const preset =
    equipPreset.value?.[viewPresetIdx.value ?? 0]?.itemEquipmentInfo
  const addEquip = []

  // 칭호
  const title = equipPreset.value?.[3]?.itemEquipmentInfo?.[0]
  if (title) addEquip.push(title)

  // TODO: 드래곤, 메카닉 장비

  return preset?.concat(addEquip)
})

const mainStatName = findMainStat(character.value)?.toUpperCase() ?? 'ERR'
const atkStat = mainStatName === 'INT' ? '마력' : '공격력'
</script>
