<template>
  <div>
    <div class="flex flex-col py-12">
      <div class="text-8xl font-black text-lucidgray-light">Coordinate</div>
      <div class="my-12 flex flex-wrap items-start justify-evenly gap-y-24">
        <div class="flex flex-col px-4">
          <div class="-mb-8 text-left text-6xl font-black text-lucidgray-light">
            성능
          </div>
          <div class="flex flex-col items-end gap-4">
            <CharacterCoordinateIconView
              :view-preset="basePreset[viewBasePreset]?.cashEquipmentInfo"
              :icon-view-map="baseIconViewMap"
            />
            <div
              v-if="
                (character?.class === '제로' ||
                  character?.class === '엔젤릭버스터') &&
                basePreset.length > 1
              "
              class="flex rounded bg-white px-2 py-1 text-sm text-lucidgray-dark outline outline-lucidgray-medium"
            >
              <div class="flex gap-2">
                <button
                  class="flex items-center gap-1 rounded px-1 hover:bg-lucidviolet-100"
                  :class="{
                    'bg-lucidviolet-50 font-semibold text-lucidviolet-700':
                      viewBasePreset === 0,
                    'underline underline-offset-2': activeBaseIdx === 0,
                  }"
                  @click="viewBasePreset = 0"
                >
                  <span>{{
                    character?.class === '제로'
                      ? '알파'
                      : character?.class === '엔젤릭버스터'
                        ? '일반'
                        : ''
                  }}</span>
                </button>
                <button
                  class="flex items-center gap-1 rounded px-1 hover:bg-lucidviolet-100"
                  :class="{
                    'bg-lucidviolet-50 font-semibold text-lucidviolet-700':
                      viewBasePreset === 1,
                    'underline underline-offset-2': activeBaseIdx === 1,
                  }"
                  @click="viewBasePreset = 1"
                >
                  {{
                    character?.class === '제로'
                      ? '베타'
                      : character?.class === '엔젤릭버스터'
                        ? '드레스업'
                        : ''
                  }}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="flex flex-col px-4">
          <div class="-mb-8 text-left text-6xl font-black text-lucidgray-light">
            외형
          </div>
          <div class="flex flex-col items-end gap-4">
            <CharacterCoordinateIconView
              :view-preset="coordiPreset[viewCoordiPreset]?.cashEquipmentInfo"
              :base-preset="
                basePreset[Math.floor(viewCoordiPreset / 3)]?.cashEquipmentInfo
              "
              :icon-view-map="coordiIconViewMap"
            />
            <div
              class="flex justify-end gap-4 rounded bg-white p-1 text-sm text-lucidgray-dark outline outline-lucidgray-medium"
            >
              <div
                v-if="
                  character?.class === '제로' ||
                  character?.class === '엔젤릭버스터'
                "
                class="flex gap-2 px-1"
              >
                <button
                  class="flex items-center gap-1 rounded px-1 hover:bg-lucidviolet-100"
                  :class="{
                    'bg-lucidviolet-50 font-semibold text-lucidviolet-700':
                      viewCoordiAlpha === 0,
                    'underline underline-offset-2': activeBaseIdx === 0,
                  }"
                  @click="setCoordiAlpha(0)"
                >
                  <span>{{
                    character?.class === '제로'
                      ? '알파'
                      : character?.class === '엔젤릭버스터'
                        ? '일반'
                        : ''
                  }}</span>
                </button>
                <button
                  class="flex items-center gap-1 rounded px-1 hover:bg-lucidviolet-100"
                  :class="{
                    'bg-lucidviolet-50 font-semibold text-lucidviolet-700':
                      viewCoordiAlpha === 1,
                    'underline underline-offset-2': activeBaseIdx === 1,
                  }"
                  @click="setCoordiAlpha(1)"
                >
                  {{
                    character?.class === '제로'
                      ? '베타'
                      : character?.class === '엔젤릭버스터'
                        ? '드레스업'
                        : ''
                  }}
                </button>
              </div>
              <div class="flex gap-1">
                <template v-for="presetNo in [1, 2, 3]" :key="presetNo">
                  <button
                    class="size-5 rounded hover:bg-lucidviolet-100 disabled:opacity-50 disabled:hover:bg-transparent"
                    :disabled="!coordiPreset[presetNo - 1]?.cashEquipmentInfo"
                    :class="{
                      'bg-lucidviolet-100 font-semibold text-lucidviolet-700':
                        viewCoordiPreset === presetNo - 1 + viewCoordiAlpha * 3,
                      underline: activeCoordiIdx === presetNo - 1,
                    }"
                    @click="
                      viewCoordiPreset = presetNo - 1 + viewCoordiAlpha * 3
                    "
                  >
                    {{ presetNo }}
                  </button>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="my-12 flex flex-wrap items-start justify-evenly gap-y-24">
        <div class="flex flex-col px-4">
          <div class="-mb-8 text-left text-6xl font-black text-lucidgray-light">
            안드로이드
          </div>
          <CharacterCoordinateIconView
            :view-preset="[]"
            :icon-view-map="androidIconViewMap"
          />
        </div>
        <div class="flex flex-col px-4">
          <div class="mb-12 text-left text-6xl font-black text-lucidgray-light">
            펫
            <span class="font-normal">⋅</span>
            장비
          </div>
          <div class="flex flex-col items-stretch gap-4">
            <div
              class="flex h-8 items-center justify-between gap-12 text-lucidviolet-700"
            >
              <span class="basis-1/3 text-center text-lg font-light">{{
                petEquipmentFixed[0]?.petInfo.petNickname
              }}</span>
              <span class="basis-1/3 text-center text-lg font-light">{{
                petEquipmentFixed[1]?.petInfo.petNickname
              }}</span>
              <span class="basis-1/3 text-center text-lg font-light">{{
                petEquipmentFixed[2]?.petInfo.petNickname
              }}</span>
            </div>
            <div>
              <CharacterCoordinatePetIconView
                :pet-equipment="petEquipmentFixed"
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
const cashEquipmentPreset = computed(() => character.value?.cashEquipmentPreset)
const petEquipment = computed(() => character.value?.petEquipment)
// 펫이 없거나 3개 이하일시 3개로 고정
const petEquipmentFixed = computed(() => {
  return [
    petEquipment.value?.[0],
    petEquipment.value?.[1],
    petEquipment.value?.[2],
  ]
})

const basePreset = computed(() => {
  const preset = []
  preset.push(cashEquipmentPreset.value?.find((item) => item?.presetNo === 0))

  // 제로 베타, 엔버 드레스온
  if (cashEquipmentPreset.value?.find((item) => item?.presetNo === 4))
    preset.push(cashEquipmentPreset.value?.find((item) => item?.presetNo === 4))
  return preset
})
const coordiPreset = computed(() => {
  const preset = []
  preset.push(
    cashEquipmentPreset.value?.find((item) => item?.presetNo === 1) || null,
  )
  preset.push(
    cashEquipmentPreset.value?.find((item) => item?.presetNo === 2) || null,
  )
  preset.push(
    cashEquipmentPreset.value?.find((item) => item?.presetNo === 3) || null,
  )
  preset.push(
    cashEquipmentPreset.value?.find((item) => item?.presetNo === 5) || null,
  )
  preset.push(
    cashEquipmentPreset.value?.find((item) => item?.presetNo === 6) || null,
  )
  preset.push(
    cashEquipmentPreset.value?.find((item) => item?.presetNo === 7) || null,
  )
  return preset
})

const activeCoordiIdx = computed(() => {
  return coordiPreset.value.findIndex((item) => item?.active === true) % 3
})
const activeBaseIdx = computed(() => {
  return coordiPreset.value.findIndex((item) => item?.active === true) >= 3
    ? 1
    : 0
})
const viewBasePreset = ref(activeBaseIdx.value)
const viewCoordiAlpha = ref(activeBaseIdx.value)
const viewCoordiPreset = ref(activeCoordiIdx.value + activeBaseIdx.value * 3)

const setCoordiAlpha = (alpha: 0 | 1) => {
  viewCoordiAlpha.value = alpha
  viewCoordiPreset.value = (viewCoordiPreset.value % 3) + alpha * 3
}

watch(
  activeBaseIdx,
  (newValue) => {
    if (newValue !== undefined) {
      viewBasePreset.value = newValue
      viewCoordiAlpha.value = newValue
      viewCoordiPreset.value = activeCoordiIdx.value + newValue * 3
    }
  },
  { immediate: true },
)

watch(
  activeCoordiIdx,
  (newValue) => {
    if (newValue !== undefined) {
      viewCoordiPreset.value = newValue + activeBaseIdx.value * 3
    }
  },
  { immediate: true },
)

const baseIconViewMap = [
  '',
  '',
  '',
  '',
  '헤어',
  '성형',
  '피부',
  '반지1',
  '반지2',
  '반지3',
  '반지4',
  '얼굴장식',
  '눈장식',
  '귀고리',
  '무기',
  '모자',
  '한벌옷',
  '망토',
  '신발',
  '장갑',
  '방패',
]
const coordiIconViewMap = [
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '반지1',
  '반지2',
  '반지3',
  '반지4',
  '얼굴장식',
  '눈장식',
  '귀고리',
  '무기',
  '모자',
  '한벌옷',
  '망토',
  '신발',
  '장갑',
  '방패',
]
const androidIconViewMap = [
  '',
  '',
  '',
  '-',
  '-',
  '-',
  '-',
  '-',
  '-',
  '-',
  '-',
  '-',
  '-',
  '-',
  '-',
  '-',
  '-',
  '-',
  '-',
  '-',
  '-',
]
</script>
