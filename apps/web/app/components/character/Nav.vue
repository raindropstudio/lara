<template>
  <div
    class="flex items-center justify-center text-nowrap rounded-full border border-lucidviolet-200 bg-white/50 py-1 text-lucid-violetgray backdrop-blur-lg transition-all duration-300 ease-in-out"
    :class="[showImage && isReady ? 'px-1' : 'px-1']"
  >
    <div class="flex items-center justify-center">
      <HTransitionRoot
        :show="showImage && isReady"
        enter="transition-all duration-300 ease-in-out"
        enter-from="opacity-0 scale-0 size-0"
        enter-to="opacity-100 scale-100 size-6 mr-2"
        entered="size-6 mr-2"
        leave="transition-all duration-300 ease-in-out"
        leave-from="opacity-100 scale-100 size-6 mr-2"
        leave-to="opacity-0 scale-0 size-0"
      >
        <button
          class="size-6 overflow-hidden rounded-full border border-lucidviolet-200 ring-lucidviolet-50/70 hover:ring-2"
          @click="scrollToTop"
        >
          <img
            :src="getCharacterImageUrl(characterImageUrl)"
            alt="character avatar"
            class="size-12 -translate-y-1/4 -scale-x-100 object-cover"
            draggable="false"
          />
        </button>
      </HTransitionRoot>
    </div>
    <div class="relative flex items-center justify-center font-light">
      <NuxtLink
        v-for="(menu, idx) in menus"
        :key="idx"
        :to="{ hash: menu.hash }"
        class="rounded-full px-4 transition-all hover:bg-lucidviolet-100/70 hover:text-lucidviolet-800"
        :class="[
          currentSection === menu.hash.slice(1)
            ? 'bg-lucidviolet-50/70 text-lucidviolet-800'
            : '',
        ]"
      >
        {{ menu.name }}
      </NuxtLink>
    </div>
    <button
      class="flex items-center justify-center rounded-full px-1 font-extralight hover:bg-lucidviolet-100/70"
      :disabled="updateStatus === 'pending'"
      :class="[
        updateStatus === 'pending'
          ? 'cursor-wait text-lucidviolet-400'
          : 'cursor-pointer',
        updateStatus === 'error' ? 'text-red-500' : 'text-lucidviolet-500',
      ]"
      @click="$emit('refresh')"
    >
      <span
        v-if="updateStatus === 'pending' && collectionRun"
        class="px-1 text-xs"
      >
        {{ collectionRun.completed }}/{{ collectionRun.total }}
        <template v-if="collectionRun.failed > 0"
          >· 실패 {{ collectionRun.failed }}</template
        >
      </span>
      <HTransitionRoot
        :show="updateStatus !== 'pending'"
        enter="transition-all duration-300 ease-in-out"
        enter-from="opacity-0 w-0"
        enter-to="opacity-100 w-16"
        leave="transition-all duration-300 ease-in-out"
        leave-from="opacity-100 w-16"
        leave-to="opacity-0 w-0"
      >
        <span class="inline-block w-16">
          {{ duration === '0분' ? '방금 전' : duration + ' 전' }}
        </span>
      </HTransitionRoot>
      <div class="size-4">
        <IconRefresh v-if="updateStatus !== 'pending'" />
        <IconSpinner v-if="updateStatus === 'pending'" />
      </div>
    </button>
  </div>
</template>

<script lang="ts" setup>
import humanizeDuration from 'humanize-duration'
import type { CollectionRun } from '~/types/api.type'

const props = defineProps<{
  characterImageUrl: string | undefined
  showImage: boolean
  updatedAt: string | undefined
  updateStatus: string
  collectionRun: CollectionRun | null
  currentSection: string
}>()
defineEmits<{
  refresh: []
}>()
const {
  characterImageUrl,
  showImage,
  updatedAt,
  updateStatus,
  collectionRun,
  currentSection,
} = toRefs(props)

// 캐릭터 이미지 아이콘 플래시때문에 딜레이 추가
const isReady = ref(false)

onMounted(() => {
  setTimeout(() => {
    isReady.value = true
  }, 300)
})

onActivated(() => {
  setTimeout(() => {
    isReady.value = true
  }, 300)
})

onDeactivated(() => {
  isReady.value = false
})

const duration = computed(() => {
  if (!updatedAt.value) return ''
  return humanizeDuration(Date.now() - new Date(updatedAt.value).getTime(), {
    language: 'ko',
    largest: 1,
    round: true,
    units: ['y', 'mo', 'd', 'h', 'm'],
    spacer: '',
  })
})

const menus = [
  { name: '요약', hash: '#summary' },
  { name: '장비', hash: '#equipment' },
  { name: '스킬', hash: '#skill' },
  { name: '스탯', hash: '#stat' },
  { name: '유니온', hash: '#union' },
]

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
  // after scroll, url hash will be removed
  setTimeout(() => {
    window.location.hash = ''
  }, 1000)
}
</script>
