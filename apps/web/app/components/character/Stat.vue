<template>
  <div class="flex w-full flex-col py-12">
    <UiSectionTitle>Stats</UiSectionTitle>
    <div class="my-12 flex flex-wrap items-start justify-evenly gap-y-24">
      <div class="flex w-full max-w-full flex-col px-2 sm:w-auto sm:px-4">
        <CharacterStatInfo :character="character" />
      </div>

      <div class="w-full max-w-full px-2 sm:w-auto sm:px-4">
        <div class="flex min-w-0 flex-col gap-12 sm:min-w-96">
          <div class="flex flex-col">
            <div
              class="-mb-3 text-left text-5xl font-extrabold text-lucidgray-light"
            >
              어빌리티
            </div>
            <CharacterStatAbilityInfo
              v-if="character?.ability"
              :ability="character.ability"
            />
          </div>

          <div class="flex flex-col">
            <div
              class="-mb-3 text-left text-5xl font-extrabold text-lucidgray-light"
            >
              하이퍼스탯
            </div>
            <CharacterStatHyperStatInfo
              v-if="character?.hyperStatPreset"
              :hyper-stat-preset="character.hyperStatPreset"
            />
          </div>

          <div class="flex flex-col">
            <div
              class="-mb-3 text-left text-5xl font-extrabold text-lucidgray-light"
            >
              성향
            </div>
            <CharacterStatPropensityInfo
              v-if="character?.propensity"
              :propensity="character.propensity"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  character: Character
}>()
</script>
