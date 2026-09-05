<script setup lang="ts">
import {
  autoUpdate,
  limitShift,
  offset,
  shift,
  useFloating,
} from '@floating-ui/vue'
import { ref, toRefs } from 'vue'
import type { Skill } from '~/types/skill.type'
import { getSkillImageUrl } from '~/utils/getImageUrl'

const props = defineProps<{
  skill: Skill | undefined
}>()

const { skill } = toRefs(props)
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

const specialSkillImage = await getSpecialSkillImageUrl(skill.value?.name || '') // 특수 코어 이미지 가져오기
</script>

<template>
  <div
    ref="popupRef"
    class="relative inline-block"
    @mouseenter="visible = true"
    @mouseleave="visible = false"
  >
    <slot />
    <div
      v-if="visible && skill"
      ref="popupFloating"
      :style="floatingStyles"
      class="pointer-events-none absolute left-0 top-0 z-50 w-96 overflow-visible rounded-md bg-white/50 p-2 text-xs font-light text-lucidviolet-900 ring-2 ring-lucidgray-light backdrop-blur-2xl"
    >
      <!-- 스킬 이름 -->
      <div class="py-1 text-center text-lg font-bold">
        {{ skill.name }}
      </div>

      <div class="flex gap-2">
        <!-- 왼쪽: 스킬 아이콘 -->
        <div class="flex size-14 shrink-0 items-center justify-center pl-1">
          <img
            :src="getSkillImageUrl(skill.icon) || specialSkillImage"
            :alt="skill.name"
            class="size-14 object-contain [image-rendering:pixelated]"
          />
        </div>

        <!-- 오른쪽: 스킬 설명 -->
        <div class="flex-1 pl-1">
          <div class="whitespace-pre-wrap text-pretty break-words">
            {{ skill.description }}
          </div>
        </div>
      </div>

      <!-- 구분선 -->
      <hr class="my-2 border-t border-dashed border-gray-200" />

      <!-- 스킬 효과 -->
      <div v-if="skill.effect" class="text-lucidgray-dark">
        <div class="mb-1 font-semibold">
          현재 레벨 효과 [Lv. {{ skill.level }}]
        </div>
        <div class="whitespace-pre-wrap text-pretty break-words">
          {{ skill.effect }}
        </div>
      </div>

      <!-- 다음 레벨 효과 -->
      <div
        v-if="skill.effectNext && skill.level < 30"
        class="mt-2 text-lucidgray-dark"
      >
        <div class="mb-1 font-semibold">
          다음 레벨 효과 [Lv. {{ skill.level + 1 }}]
        </div>
        <div class="whitespace-pre-wrap text-pretty break-words">
          {{ skill.effectNext }}
        </div>
      </div>
    </div>
  </div>
</template>
