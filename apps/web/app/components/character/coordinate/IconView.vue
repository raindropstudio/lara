<template>
  <div>
    <div class="grid grid-cols-7 gap-4">
      <template v-for="(item, idx) in mappedPreset" :key="idx">
        <UiItemTooltip :item="item || mappedBasePreset[idx]">
          <div
            v-if="iconViewMap[idx]"
            class="relative z-0 flex size-12 items-center justify-center rounded-lg drop-shadow-md transition-all duration-700 ease-in-out hover:bg-gray-100"
            :class="[
              getSlotColor(item),
              itemChanged[idx] ? '' : 'ring-2',
              item ? 'bg-gray-50' : 'bg-gray-100',
            ]"
          >
            <img
              v-if="item"
              :src="getItemImageUrl(item.icon)"
              :alt="item.name"
              class="drop-shadow-md transition-all duration-300 ease-in-out [image-rendering:_pixelated]"
            />
            <img
              v-else-if="mappedBasePreset[idx]"
              :src="getItemImageUrl(mappedBasePreset[idx]?.icon)"
              :alt="mappedBasePreset[idx]?.name"
              class="opacity-40 drop-shadow-md transition-all duration-300 ease-in-out [image-rendering:_pixelated]"
            />
          </div>
          <div v-else class="size-12" />
        </UiItemTooltip>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  viewPreset: CashEquipmentInfo[] | undefined
  basePreset?: CashEquipmentInfo[] | undefined
  iconViewMap: string[]
}>()

const { viewPreset, basePreset, iconViewMap } = toRefs(props)

const mappedPreset = computed(() => {
  return iconViewMap.value.map((slot) =>
    viewPreset.value?.find((equip) => equip.slot === slot),
  )
})
const mappedBasePreset = computed(() => {
  return iconViewMap.value.map((slot) =>
    basePreset?.value?.find((equip) => equip.slot === slot),
  )
})

// 아이템 부드럽게 변경
const itemChanged = ref(new Array(iconViewMap.value.length).fill(false))
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

const getSlotColor = (item?: CashEquipmentInfo) => {
  if (!item) return 'ring-lucidgray-light'
  return 'ring-potential-normal'
}
</script>
