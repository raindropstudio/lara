<template>
  <div class="group flex items-center gap-2">
    <button
      class="peer flex grow items-center gap-2 rounded-lg p-2 group-hover:bg-lucidviolet-50"
      @click="navigateTo(`/character/${entry.query}`)"
    >
      <div
        class="size-8 overflow-hidden rounded-full border border-lucidviolet-200 ring-lucidviolet-50"
      >
        <img
          :src="getCharacterImageUrl(entry.info.imageUrl)"
          alt="character avatar"
          class="size-16 -translate-y-1/4 -scale-x-100 object-cover"
          draggable="false"
        />
      </div>
      <div class="text-xl font-medium text-lucidviolet-700">
        {{ entry.info.nickname }}
      </div>
      <div class="text-base font-light text-lucid-violetgray">
        <span class="font-normal">Lv.{{ entry.info.level }}</span>
        | {{ entry.info.class }} | {{ entry.info.worldName }} |
        {{ entry.info.guildName ? entry.info.guildName : '-' }}
      </div>
    </button>
    <button
      v-if="type === 'favorite'"
      @click="history.deleteFavorite('character', entry.query)"
    >
      <IconStar
        class="size-12 rounded-lg p-3 text-lucidviolet-500 hover:bg-lucidviolet-50 group-hover:text-lucidviolet-300"
      />
    </button>
    <button
      v-if="type === 'history'"
      @click="history.addFavorite('character', entry.query)"
    >
      <IconStarOutline
        class="size-12 rounded-lg p-3 text-transparent hover:bg-lucidviolet-50 group-hover:text-lucidviolet-500"
      />
    </button>
    <button
      v-if="type === 'history'"
      @click="history.deleteHistory('character', entry.query)"
    >
      <IconClose
        class="size-12 rounded-lg p-3 text-transparent hover:bg-lucidviolet-50 group-hover:text-lucidviolet-500"
      />
    </button>
  </div>
</template>

<script lang="ts" setup>
import type { History } from '~/stores/history'

const props = defineProps<{
  entry: History
  type: 'favorite' | 'history'
}>()

const history = useHistoryStore()

const { entry, type } = toRefs(props)
</script>
