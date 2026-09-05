<template>
  <div>
    <div class="grid grid-cols-2 gap-6 sm:grid-cols-3 sm:gap-12">
      <template v-for="(pet, idx) in petEquipment" :key="idx">
        <div class="flex items-center gap-4">
          <UiPetTooltip :pet="pet">
            <div
              class="relative z-0 flex size-12 shrink-0 items-center justify-center rounded-lg bg-gray-50 ring-2 drop-shadow-md transition-all duration-700 ease-in-out hover:bg-gray-100"
              :class="getSlotColor(pet)"
            >
              <img
                v-if="pet"
                :src="getItemImageUrl(pet?.petInfo.petIcon)"
                :alt="pet?.petInfo.petName"
                class="drop-shadow-md transition-all duration-300 ease-in-out [image-rendering:_pixelated]"
              />
              <div
                v-if="pet?.petInfo.petDateExpire === '1998-12-31T15:00:00.000Z'"
                class="absolute bottom-0 right-0"
              >
                <IconWarn class="size-4 text-potential-expired" />
              </div>
            </div>
          </UiPetTooltip>
          <UiItemTooltip
            :item="
              pet?.petInfo.petEquipment
                ? mapPetItem(pet?.petInfo.petEquipment)
                : undefined
            "
          >
            <div
              class="relative z-0 flex size-12 items-center justify-center rounded-lg bg-gray-50 ring-2 drop-shadow-md transition-all duration-700 ease-in-out hover:bg-gray-100"
              :class="getSlotColor(pet)"
            >
              <img
                v-if="pet?.petInfo.petEquipment"
                :src="getItemImageUrl(pet?.petInfo.petEquipment.itemIcon)"
                :alt="pet?.petInfo.petEquipment.itemName"
                class="drop-shadow-md transition-all duration-300 ease-in-out [image-rendering:_pixelated]"
              />
            </div>
          </UiItemTooltip>
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  petEquipment: (PetEquipment | undefined)[]
}>()

const { petEquipment } = toRefs(props)

const mapPetItem = (petItem?: PetEquipmentInfo): ItemEquipmentInfo => {
  return {
    name: petItem?.itemName ?? '',
    icon: petItem?.itemIcon ?? '',
    part: '펫장비',
    slot: '펫장비',
    description: petItem?.itemDescription,
    scrollUpgrade: petItem?.scrollUpgrade,
    scrollUpgradeableCount: petItem?.scrollUpgradable,
    shapeName: petItem?.itemShape,
    shapeIcon: petItem?.itemShapeIcon,
    totalOption: {
      attackPower: petItem?.attackPower ?? undefined,
      magicPower: petItem?.magicPower ?? undefined,
    },
  }
}

const getSlotColor = (pet?: PetEquipment) => {
  if (!pet) return 'ring-lucidgray-light'
  if (!petEquipment?.value) return 'ring-potential-normal'

  return 'ring-potential-normal'
}
</script>
