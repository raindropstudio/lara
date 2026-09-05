<template>
  <div class="w-full">
    <ConfettiExplosion v-if="birthday" class="mx-auto w-full" />
    <div
      class="-mt-12 flex w-full select-none justify-center overflow-x-clip text-nowrap pt-12"
    >
      <div class="flex min-w-0 flex-1 flex-col items-end text-right text-5xl">
        <div class="mr-[-170px]">
          <CharacterHeaderLiberation :character="character" />
        </div>
        <div class="-mt-2 mr-[-160px]">
          <CharacterHeaderBirth :character="character" />
        </div>
        <div class="-mt-2 mr-[-165px]">
          <CharacterHeaderExp :character="character" />
        </div>
        <div class="-mt-2 mr-[-175px]">
          <CharacterHeaderAccess :character="character" />
        </div>
      </div>
      <div class="-mt-48">
        <img
          ref="characterImage"
          :src="getLargeCharacterImageUrl(character?.imageUrl)"
          alt="character"
          class="pointer-events-none relative z-10 size-[448px] drop-shadow-lg transition-opacity duration-300 ease-in-out [image-rendering:_pixelated]"
          :class="imageLoaded ? 'opacity-100' : 'opacity-0'"
          draggable="false"
          @load="imageLoad"
        />
      </div>
      <div class="flex min-w-0 flex-1 flex-col text-5xl">
        <div class="ms-[-180px]">
          <CharacterHeaderClass :character="character" />
        </div>
        <div class="-mt-2 ms-[-170px]">
          <CharacterHeaderWorld :character="character" />
        </div>
        <div class="-mt-2 ms-[-190px]">
          <CharacterHeaderGuild :character="character" />
        </div>
        <div class="-mt-2 ms-[-205px]">
          <CharacterHeaderPopularity :character="character" />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import ConfettiExplosion from 'vue-confetti-explosion'

const props = defineProps<{
  character: Character | undefined
}>()
const character = toRef(props, 'character')

const characterImage = ref<HTMLImageElement | null>(null)
const imageLoaded = ref(false)

// 캐릭터 이미지 깜빡임 방지
const imageLoad = () => {
  if (!imageLoaded.value) imageLoaded.value = true
  else {
    imageLoaded.value = false
    setTimeout(() => {
      imageLoaded.value = true
    }, 300)
  }
}

onMounted(() => {
  if (characterImage.value?.complete) imageLoaded.value = true
})

// 생일 여부
const birthday = computed(() => {
  if (!character.value) return false
  const created = new Date(character.value.dateCreate)
  const now = new Date()
  const kstNow = new Date(
    now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }),
  )
  return (
    kstNow.getFullYear() > created.getFullYear() &&
    kstNow.getMonth() === created.getMonth() &&
    kstNow.getDate() === created.getDate()
  )
})
</script>
