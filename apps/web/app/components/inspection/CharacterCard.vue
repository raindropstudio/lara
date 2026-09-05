<template>
  <article
    class="relative flex h-full flex-col items-center rounded-2xl border border-lucidviolet-100 bg-white/70 p-4 text-center"
  >
    <div class="flex w-full items-center justify-between text-lucidviolet-500">
      <div class="flex">
        <button
          class="size-8 rounded hover:bg-lucidviolet-50 disabled:opacity-25"
          :disabled="first"
          :aria-label="`${entry.nickname} 앞으로 이동`"
          @click="$emit('move', -1)"
        >
          ←
        </button>
        <button
          class="size-8 rounded hover:bg-lucidviolet-50 disabled:opacity-25"
          :disabled="last"
          :aria-label="`${entry.nickname} 뒤로 이동`"
          @click="$emit('move', 1)"
        >
          →
        </button>
      </div>
      <button
        class="flex size-8 items-center justify-center rounded hover:bg-rose-50 hover:text-rose-500"
        :aria-label="`${entry.nickname} 제거`"
        @click="$emit('remove')"
      >
        <IconClose class="size-4" />
      </button>
    </div>
    <NuxtLink
      :to="`/character/${encodeURIComponent(entry.nickname)}`"
      class="max-w-full truncate text-lg font-bold text-lucidviolet-700"
      >{{ entry.nickname }}</NuxtLink
    >
    <CharacterAvatar
      v-if="entry.character"
      :image-url="entry.character.imageUrl"
      :nickname="entry.nickname"
      class="size-28"
    />
    <div
      v-else
      class="flex size-28 items-center justify-center text-lucidviolet-200"
    >
      <IconSpinner v-if="entry.pending" class="size-8" /><span
        v-else
        class="text-4xl"
        >?</span
      >
    </div>
    <template v-if="entry.character">
      <p class="text-sm text-lucidviolet-500">
        Lv. {{ entry.character.level }} · {{ entry.character.class }}
      </p>
      <p class="mt-1 text-xs text-lucidgray-dark">
        {{ entry.character.worldName
        }}<span v-if="entry.character.guildName">
          · {{ entry.character.guildName }}</span
        >
      </p>
      <p
        v-if="
          entry.character.dataState.incomplete ||
          entry.character.dataState.stale
        "
        class="mt-2 text-xs text-amber-700"
      >
        일부 정보 누락 또는 이전 자료
      </p>
      <time
        class="mt-2 text-xs text-lucidgray-dark"
        :datetime="entry.character.updatedAt"
        >{{
          new Date(entry.character.updatedAt).toLocaleString('ko-KR', {
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Seoul',
          })
        }}
        기준</time
      >
    </template>
    <p v-if="entry.error" role="alert" class="my-2 text-xs text-rose-600">
      {{ entry.error }}
    </p>
    <ul v-if="notices.length" class="mt-3 space-y-1 text-xs">
      <li
        v-for="notice in notices"
        :key="notice.label"
        class="rounded px-2 py-1"
        :class="
          notice.warning
            ? 'bg-amber-50 text-amber-800'
            : 'bg-lucidviolet-50 text-lucidviolet-600'
        "
      >
        {{ notice.label }}
      </li>
    </ul>
    <button
      class="mt-auto flex min-h-10 items-center justify-center gap-1 pt-3 text-xs text-lucidviolet-500 hover:text-amber-600 disabled:cursor-wait"
      :disabled="entry.pending"
      @click="$emit('refresh')"
    >
      <IconRefresh
        class="size-3"
        :class="entry.pending ? 'animate-spin' : ''"
      />
      {{
        entry.pending
          ? entry.run
            ? `수집 중 ${entry.run.completed}/${entry.run.total}`
            : '불러오는 중'
          : entry.error
            ? '다시 시도'
            : '갱신'
      }}
    </button>
  </article>
</template>
<script setup lang="ts">
import { inspectionNotices } from '~/utils/inspection'
import type { InspectionEntry } from '~/composables/useInspection'
const props = defineProps<{
  entry: InspectionEntry
  first: boolean
  last: boolean
}>()
defineEmits<{ remove: []; refresh: []; move: [offset: number] }>()
const notices = computed(() => inspectionNotices(props.entry.character))
</script>
