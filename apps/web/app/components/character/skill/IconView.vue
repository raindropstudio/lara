<template>
  <div class="">
    <p class="mb-4 text-2xl font-light text-lucidviolet-700">
      {{ title }}
    </p>
    <div class="grid grid-cols-4 gap-8">
      <template v-for="(skill, index) in sortedSkills" :key="index">
        <div class="flex flex-col items-center">
          <UiSkillTooltip :skill="skill">
            <img
              :src="getSkillImageUrl(skill.icon) || specialSkillImage[index]"
              class="size-14 object-contain [image-rendering:pixelated]"
              :alt="skill.name"
            />
          </UiSkillTooltip>
          <div
            class="z-10 -mt-3 flex h-6 w-10 items-center justify-center rounded-lg border-[2.5px] bg-white"
            :class="
              skill.level === maxSkillLevel
                ? 'border-lucidviolet-700'
                : 'border-lucidgray-medium'
            "
          >
            <span
              class="text-base font-medium"
              :class="
                skill.level === maxSkillLevel
                  ? 'text-lucidviolet-800'
                  : 'text-lucidgray-dark'
              "
              >{{ skill.level }}</span
            >
          </div>
        </div>
      </template>
      <template v-for="index in emptyCount" :key="'empty-' + index">
        <div
          class="mb-4 size-14 rounded-xl border-4 border-lucidgray-light bg-gray-100 shadow-md"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  title: string
  skills?: Skill[]
  maxLevel?: number
  slotCount?: number
}>()

const { skills, maxLevel, slotCount } = toRefs(props)

const sortedSkills = computed(() => {
  return [...(skills.value ?? [])].sort((a, b) => b.level - a.level)
})

const maxSkillLevel = computed(() => {
  return maxLevel.value ?? 30 // 6차 기준
})

const specialSkillImage = await Promise.all(
  sortedSkills.value.map((skill) => {
    if (skill.icon === '') {
      return getSpecialSkillImageUrl(skill.name)
    }
    return ''
  }),
)

const emptyCount = computed(() => {
  // 슬롯 개수가 있으면 슬롯 개수에 맞춰서 빈칸 개수 계산
  if (slotCount.value) {
    const left = slotCount.value - (skills.value?.length ?? 0)
    const count = left > 0 ? left : 0
    return skills.value?.length === 0 ? slotCount.value : count
  }

  // 마지막줄 4의 배수 맞춰주고, skill 이 하나도 없으면 빈칸 4개
  const count = (4 - ((skills.value?.length ?? 0) % 4)) % 4
  return skills.value?.length === 0 ? 4 : count
})
</script>
