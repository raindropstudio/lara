<template>
  <div
    ref="popupRef"
    class="relative inline-block"
    @mouseenter="visible = true"
    @mouseleave="visible = false"
  >
    <slot />
    <div
      v-if="visible && pet"
      ref="popupFloating"
      :style="floatingStyles"
      class="pointer-events-none absolute left-0 top-0 z-30 w-64 overflow-visible rounded-md bg-white/50 p-2 text-xs font-light text-lucidviolet-900 ring-2 ring-lucidgray-light backdrop-blur-2xl"
    >
      <!-- 펫 이름 -->
      <div class="flex flex-col items-center justify-center py-1">
        <div class="text-center text-lg font-bold">
          {{ pet.petInfo.petName }}
        </div>
      </div>

      <!-- 점선 구분선 -->
      <hr class="my-2 border-t border-dashed border-gray-200" />

      <!-- 펫 이미지와 정보 -->
      <div class="mt-2 flex items-stretch space-x-2">
        <div
          class="flex size-16 items-center justify-center rounded-md border-2 border-lucidgray-medium bg-gray-50"
        >
          <img
            :src="getItemImageUrl(pet.petInfo.petAppearanceIcon)"
            :alt="pet.petInfo.petName"
            class="size-10 object-contain [image-rendering:pixelated]"
          />
        </div>
        <div class="flex flex-col items-start text-xs">
          <div class="flex h-4 items-center justify-center gap-1">
            <span
              v-if="pet.petInfo.petType"
              class="font-medium text-lucidviolet-800"
            >
              {{ pet.petInfo.petType }} 펫
            </span>
          </div>
          <div class="font-light">이름 : {{ pet.petInfo.petNickname }}</div>
          <div
            v-if="pet.petInfo.petDateExpire"
            class="font-light"
            :class="{ 'text-potential-expired': isExpired }"
          >
            {{ getExpirationText }}
          </div>
          <div
            v-if="pet.petInfo.petAppearance !== pet.petInfo.petName"
            class="font-light text-lucidgray-dark"
          >
            외형 : {{ pet.petInfo.petAppearance }}
          </div>
        </div>
      </div>

      <!-- 자동 스킬 -->
      <div v-if="pet.petInfo.petAutoSkill">
        <!-- 점선 구분선 -->
        <hr class="my-2 border-t border-dashed border-gray-200" />
        <div class="mb-1 font-semibold">자동 스킬</div>
        <!-- skill1이 있을 때만 표시 -->
        <div
          v-if="pet.petInfo.petAutoSkill.skill1"
          class="mb-1 flex items-center gap-1"
        >
          <img
            :src="getSkillImageUrl(pet.petInfo.petAutoSkill.skill1Icon)"
            :alt="pet.petInfo.petAutoSkill.skill1"
            class="size-5 [image-rendering:pixelated]"
          />
          {{ pet.petInfo.petAutoSkill.skill1 }}
        </div>
        <!-- skill2가 있을 때만 표시 -->
        <div
          v-if="pet.petInfo.petAutoSkill.skill2"
          class="flex items-center gap-1"
        >
          <img
            :src="getSkillImageUrl(pet.petInfo.petAutoSkill.skill2Icon)"
            :alt="pet.petInfo.petAutoSkill.skill2"
            class="size-5 [image-rendering:pixelated]"
          />
          {{ pet.petInfo.petAutoSkill.skill2 }}
        </div>
      </div>

      <!-- 펫 스킬 -->
      <div v-if="pet.petInfo.petSkills.length > 0">
        <!-- 점선 구분선 -->
        <hr class="my-2 border-t border-dashed border-gray-200" />
        <div class="mb-1 font-semibold">펫 스킬</div>
        <div class="flex flex-wrap gap-1">
          <template
            v-for="(skill, index) in pet.petInfo.petSkills"
            :key="index"
          >
            <div
              class="rounded-lg bg-lucid-light px-1 ring-1 ring-lucidgray-light"
            >
              {{ skill }}
            </div>
          </template>
        </div>
      </div>

      <!-- 펫 설명 -->
      <div v-if="pet.petInfo.petDescription">
        <!-- 점선 구분선 -->
        <hr class="my-2 border-t border-dashed border-gray-200" />
        <div class="whitespace-pre-wrap text-pretty break-words">
          {{ pet.petInfo.petDescription }}
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
import type { PetEquipment } from '~/types/petEquipment.type'

const props = defineProps<{
  pet: PetEquipment | undefined
}>()

const { pet } = toRefs(props)
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

const isExpired = computed(() => {
  return !!(
    pet.value?.petInfo.petDateExpire &&
    new Date(pet.value.petInfo.petDateExpire) < new Date()
  )
})

const getExpirationText = computed(() => {
  if (!pet.value?.petInfo.petDateExpire) return ''

  if (isExpired.value) {
    return '마법의 시간이 끝났음'
  }

  return `마법의 시간 : ${formatDateTime(pet.value.petInfo.petDateExpire)}까지`
})
</script>
