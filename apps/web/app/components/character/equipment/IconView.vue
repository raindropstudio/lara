<template>
  <div>
    <div class="grid grid-cols-5 gap-4">
      <template v-for="(item, idx) in mappedPreset" :key="idx">
        <UiItemTooltip :item="item">
          <div
            v-if="iconViewMap[idx]"
            class="relative z-0 flex size-12 items-center justify-center rounded bg-gray-50 drop-shadow-md transition-all duration-700 ease-in-out hover:bg-gray-100"
            :class="[getSlotColor(item), itemChanged[idx] ? '' : 'ring-2']"
          >
            <img
              v-if="item"
              :src="getItemImageUrl(item.icon)"
              :alt="item.name"
              class="drop-shadow-md transition-all duration-300 ease-in-out [image-rendering:_pixelated]"
            />
            <div
              v-if="item?.dateOptionExpire === '1998-12-31T15:00:00.000Z'"
              class="absolute bottom-0 right-0"
            >
              <IconWarn class="size-4 text-potential-expired" />
            </div>
          </div>
          <div v-else class="size-12" />
        </UiItemTooltip>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  viewPreset: ItemEquipmentInfo[] | undefined
}>()

const { viewPreset } = toRefs(props)

const iconViewMap = [
  '반지4',
  '',
  '모자',
  '',
  '엠블렘',
  '반지3',
  '펜던트2',
  '얼굴장식',
  '',
  '뱃지',
  '반지2',
  '펜던트',
  '눈장식',
  '귀고리',
  '훈장',
  '반지1',
  '무기',
  '상의',
  '어깨장식',
  '보조무기',
  '포켓 아이템',
  '벨트',
  '하의',
  '장갑',
  '망토',
  '칭호',
  '',
  '신발',
  '',
  '기계 심장',
]

const mappedPreset = computed(() => {
  return iconViewMap.map((slot) =>
    viewPreset.value?.find((equip) => equip.slot === slot),
  )
})

// 아이템 부드럽게 변경
const itemChanged = ref(new Array(iconViewMap.length).fill(false))
watch(
  () => mappedPreset.value,
  (newPreset, oldPreset) => {
    newPreset.forEach((item, idx) => {
      if (item?.icon !== oldPreset[idx]?.icon) {
        itemChanged.value[idx] = true
        setTimeout(() => {
          itemChanged.value[idx] = false
        }, 300)
      }
    })
  },
)

const getSlotColor = (item?: ItemEquipmentInfo) => {
  if (!viewPreset?.value) return 'ring-potential-normal'
  if (!item) return 'ring-lucidgray-light'

  const grade = item?.potentialOptionGrade
  const addiGrade = item?.additionalPotentialOptionGrade

  if (item.exceptionalOption?.exceptionalUpgrade)
    return 'ring-potential-exceptional'
  if (grade === 'LEGENDARY' || addiGrade === 'LEGENDARY')
    return 'ring-potential-legendary'
  if (grade === 'UNIQUE' || addiGrade === 'UNIQUE')
    return 'ring-potential-unique'
  if (grade === 'EPIC' || addiGrade === 'EPIC') return 'ring-potential-epic'
  if (grade === 'RARE' || addiGrade === 'RARE') return 'ring-potential-rare'
  if (item.dateOptionExpire === '1998-12-31T15:00:00.000Z')
    return 'ring-potential-expired'
  return 'ring-potential-normal'
}
</script>
