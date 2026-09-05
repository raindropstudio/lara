<template>
  <div>
    <div class="flex flex-col py-12">
      <div class="flex items-end justify-between">
        <div class="text-8xl font-black text-lucidgray-light">HEXA</div>

        <div class="mb-4 flex items-end justify-end gap-2">
          <div class="flex items-center gap-1 text-lucidgray-dark">
            <IconInfo class="size-4" />
            <p class="text-2xl font-extralight">진행률</p>
          </div>
          <span class="text-5xl font-extralight text-lucidviolet-700"
            >{{
              (
                (erdaProgress.currentErdaPiece / erdaProgress.totalErdaPiece) *
                100
              ).toFixed(2)
            }}%</span
          >
        </div>
      </div>
      <div class="my-12 flex flex-col items-start justify-center gap-y-12">
        <div class="flex w-full flex-wrap items-start justify-evenly gap-y-12">
          <CharacterSkillIconView
            title="스킬 코어"
            :skills="skillCores"
            class="px-4"
          />
          <CharacterSkillIconView
            title="공용 코어"
            :skills="commonCores"
            class="px-4"
          />
        </div>
        <div class="flex w-full flex-wrap items-start justify-evenly gap-y-12">
          <CharacterSkillIconView
            title="마스터리 코어"
            :skills="masteryCores"
            class="px-4"
          />
          <CharacterSkillIconView
            title="강화 코어"
            :skills="enhanceCores"
            class="px-4"
          />
        </div>
      </div>
      <div class="my-12 flex flex-col items-start justify-center gap-y-6">
        <div class="flex w-full flex-col gap-y-6">
          <div
            v-for="(group, groupIndex) in [[0, 1], [2]]"
            :key="groupIndex"
            class="flex w-full flex-wrap items-start justify-evenly gap-y-6"
          >
            <div
              v-for="key in group"
              :key="key"
              class="flex flex-col gap-4 px-4"
            >
              <div
                class="flex h-24 w-80 gap-4 rounded-lg bg-white p-4 ring-2"
                :class="{
                  'ring-lucidviolet-500': activeHexaStat[key]?.statGrade === 20,
                  'ring-lucidgray-medium':
                    activeHexaStat[key]?.statGrade !== 20,
                }"
              >
                <div class="flex items-center justify-center">
                  <img
                    :src="hexaImage[key]"
                    class="size-14 object-contain [image-rendering:pixelated]"
                    :class="{ 'opacity-40': !activeHexaStat[key] }"
                  />
                </div>
                <div
                  v-if="activeHexaStat[key]"
                  class="flex grow flex-col justify-center"
                >
                  <div
                    class="flex items-center justify-between gap-2 text-sm font-bold text-lucidviolet-700"
                  >
                    <div class="flex items-center gap-1">
                      <span class="">{{
                        activeHexaStat[key]?.mainStatName
                      }}</span>
                      <span class="font-extrabold"
                        >+{{
                          getHexaStatAmount({
                            characterMainStat: characterMainStat,
                            hexaStatName: activeHexaStat[key]?.mainStatName,
                            hexaStatLevel: activeHexaStat[key]?.mainStatLevel,
                            isMainHexaStat: true,
                          })
                        }}</span
                      >
                    </div>
                    <span class="w-8"
                      >Lv.{{ activeHexaStat[key]?.mainStatLevel }}</span
                    >
                  </div>
                  <div
                    class="flex items-center justify-between gap-2 text-sm font-medium text-lucidgray-dark"
                  >
                    <div class="flex items-center gap-1">
                      <span class="">{{
                        activeHexaStat[key]?.subStat1Name
                      }}</span>
                      <span class="font-semibold"
                        >+{{
                          getHexaStatAmount({
                            characterMainStat: characterMainStat,
                            hexaStatName: activeHexaStat[key]?.subStat1Name,
                            hexaStatLevel: activeHexaStat[key]?.subStat1Level,
                            isMainHexaStat: false,
                          })
                        }}</span
                      >
                    </div>
                    <span class="w-8 text-sm text-lucidgray-dark"
                      >Lv.{{ activeHexaStat[key]?.subStat1Level }}</span
                    >
                  </div>
                  <div
                    class="flex items-center justify-between gap-2 text-sm font-medium text-lucidgray-dark"
                  >
                    <div class="flex items-center gap-1">
                      <span class="">{{
                        activeHexaStat[key]?.subStat2Name
                      }}</span>
                      <span class="font-semibold"
                        >+{{
                          getHexaStatAmount({
                            characterMainStat: characterMainStat,
                            hexaStatName: activeHexaStat[key]?.subStat2Name,
                            hexaStatLevel: activeHexaStat[key]?.subStat2Level,
                            isMainHexaStat: false,
                          })
                        }}</span
                      >
                    </div>
                    <span class="w-8 text-sm text-lucidgray-dark"
                      >Lv.{{ activeHexaStat[key]?.subStat2Level }}</span
                    >
                  </div>
                </div>
                <div v-else>
                  <div class="flex items-center gap-2" />
                </div>
              </div>
            </div>
            <div v-if="Object.keys(group).length === 1" class="px-4">
              <div class="h-24 w-80 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  character?: Character
}>()

const { character } = toRefs(props)

const characterMainStat = computed(() => findMainStat(character.value))

// 헥사 스킬만 필터링 (grade가 '6'인 스킬)
const hexaSkills = computed(
  () =>
    character.value?.skill?.filter((skill: Skill) => skill.grade === '6') ?? [],
)
const hexaCores = computed(
  () =>
    character.value?.skillCore?.filter((core) => core.skillCore.grade === 6) ??
    [],
)

// 스킬 이름으로 스킬 정보를 찾는 함수
const findSkillByName = (name: string | undefined) => {
  if (!name) return undefined
  return hexaSkills.value.find((skill) => skill.name === name)
}

// 스킬 타입별로 분류
const skillCoreCores = computed(() =>
  hexaCores.value.filter((core) => core.skillCore.coreType === '스킬 코어'),
)
const skillCores = computed(() => {
  return skillCoreCores.value.flatMap((core) =>
    core.skillCore.coreSkill
      .map((skillName) => findSkillByName(skillName))
      .filter((skill): skill is Skill => skill !== undefined),
  )
})

const masteryCoreCores = computed(() =>
  hexaCores.value.filter((core) => core.skillCore.coreType === '마스터리 코어'),
)
const masteryCores = computed(() => {
  return masteryCoreCores.value.flatMap((core) =>
    core.skillCore.coreSkill
      .map((skillName) => findSkillByName(skillName))
      .filter((skill): skill is Skill => skill !== undefined),
  )
})

const commonCoreCores = computed(() =>
  hexaCores.value.filter((core) => core.skillCore.coreType === '공용 코어'),
)
const commonCores = computed(() => {
  return commonCoreCores.value.flatMap((core) =>
    core.skillCore.coreSkill
      .map((skillName) => findSkillByName(skillName))
      .filter((skill): skill is Skill => skill !== undefined),
  )
})

const enhanceCoreCores = computed(() =>
  hexaCores.value.filter((core) => core.skillCore.coreType === '강화 코어'),
)
const enhanceCores = computed(() => {
  return enhanceCoreCores.value.flatMap((core) =>
    core.skillCore.coreSkill
      .map((skillName) => findSkillByName(skillName))
      .filter((skill): skill is Skill => skill !== undefined),
  )
})

const erdaProgress = computed(() => getHexaProgress(character.value))

const HEXA_STAT_NO = [1, 2, 3]

const hexaStat = computed(() => character.value?.hexaStat ?? [])
const activeHexaStat = computed(() =>
  hexaStat.value.filter((stat) => stat.active),
)

const hexaImage = await Promise.all(
  HEXA_STAT_NO.map((no) => getHexaStatImageUrl(no.toString())),
)
</script>
