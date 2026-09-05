<template>
  <article class="party-member">
    <div class="member-actions">
      <button :aria-label="`${entry.nickname} 제거`" @click="$emit('remove')">
        <IconClose class="size-3" />
      </button>
      <button
        :disabled="first"
        :aria-label="`${entry.nickname} 앞으로 이동`"
        @click="$emit('move', -1)"
      >
        ←
      </button>
      <button
        :disabled="last"
        :aria-label="`${entry.nickname} 뒤로 이동`"
        @click="$emit('move', 1)"
      >
        →
      </button>
      <NuxtLink
        :to="`/character/${encodeURIComponent(entry.nickname)}`"
        :aria-label="`${entry.nickname} 상세 조회`"
        >↗</NuxtLink
      >
    </div>
    <NuxtLink
      :to="`/character/${encodeURIComponent(entry.nickname)}`"
      class="member-name"
      >{{ entry.nickname }}</NuxtLink
    >
    <div class="member-avatar">
      <CharacterAvatar
        v-if="entry.character"
        :image-url="entry.character.imageUrl"
        :nickname="entry.nickname"
      />
      <IconSpinner v-else-if="entry.pending" class="size-8" />
      <span v-else class="missing-avatar">?</span>
    </div>
    <button
      class="member-refresh"
      :disabled="entry.pending"
      @click="$emit('refresh')"
    >
      <template v-if="entry.pending">{{
        entry.run
          ? `수집 중 ${entry.run.completed}/${entry.run.total}`
          : '불러오는 중'
      }}</template>
      <template v-else-if="entry.error">다시 시도</template>
      <time v-else-if="entry.character" :datetime="entry.character.updatedAt"
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
      <span v-else>갱신</span>
      <IconRefresh class="size-3" :class="{ 'animate-spin': entry.pending }" />
    </button>
    <p class="member-class">{{ entry.character?.class ?? '직업 확인 불가' }}</p>
    <p class="member-level">
      {{ entry.character ? `Lv.${entry.character.level}` : 'Lv.—' }}
    </p>
    <div class="member-status">
      <p v-if="entry.error" role="alert" class="status-badge status-error">
        {{ entry.error }}<span aria-hidden="true">!</span>
      </p>
      <p
        v-if="
          entry.character?.dataState.incomplete ||
          entry.character?.dataState.stale
        "
        class="status-badge"
      >
        일부 정보 확인 필요<span aria-hidden="true">?</span>
      </p>
      <p
        v-for="notice in notices"
        :key="notice.label"
        class="status-badge"
        :class="{ 'status-error': notice.warning }"
      >
        {{ notice.label }}<span aria-hidden="true">!</span>
      </p>
      <p
        v-if="
          entry.character &&
          !entry.pending &&
          !entry.error &&
          !notices.length &&
          !entry.character.dataState.incomplete &&
          !entry.character.dataState.stale
        "
        class="member-clear"
      >
        <span aria-hidden="true">✓</span>확인된 주의사항 없음
      </p>
    </div>
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

<style scoped>
.party-member {
  min-width: 0;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.member-actions {
  display: flex;
  justify-content: center;
  gap: 2px;
  height: 28px;
  color: #9188aa;
}
.member-actions button,
.member-actions a {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  font-size: 14px;
}
.member-actions button:hover,
.member-actions a:hover {
  color: #df9c43;
}
.member-actions button:disabled {
  opacity: 0.2;
}
.member-name {
  max-width: 100%;
  font-size: clamp(18px, 1.9vw, 28px);
  font-weight: 750;
  letter-spacing: -0.045em;
  color: #827991;
  overflow-wrap: anywhere;
}
.member-avatar {
  height: 150px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.member-avatar :deep(img) {
  width: 160px;
  height: 160px;
  max-width: none;
  transform: scale(1.9);
}
.missing-avatar {
  font-size: 64px;
  color: #d6d4de;
}
.member-refresh {
  min-height: 28px;
  display: flex;
  gap: 4px;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #aaa6b4;
  padding: 2px 4px;
}
.member-refresh:hover {
  color: #8a7caa;
}
.member-class {
  font-size: 13px;
  color: #aaa5b4;
  line-height: 1.6;
}
.member-level {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.4;
}
.member-status {
  width: 100%;
  min-height: 140px;
  margin-top: 28px;
  padding: 20px 8px 26px;
  background: #fff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
}
.status-badge {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 9px 16px 9px 8px;
  border-radius: 12px;
  background: #fcf0d3;
  color: #b6934e;
  font-size: 11px;
  font-weight: 600;
  overflow-wrap: anywhere;
}
.status-error {
  background: #fde4e8;
  color: #ce7880;
}
.status-badge > span {
  position: absolute;
  right: 4px;
  bottom: -12px;
  font-size: 58px;
  line-height: 1;
  color: #fff;
  opacity: 0.65;
  z-index: -1;
}
.member-clear {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  font-size: 10px;
  color: #aaa6b4;
}
.member-clear > span {
  width: 28px;
  height: 28px;
  border: 2px solid #88acdc;
  border-radius: 50%;
  font-size: 18px;
  color: #88acdc;
  line-height: 24px;
}
@media (max-width: 639px) {
  .member-name {
    font-size: 26px;
  }
  .member-status {
    min-height: 80px;
    margin-top: 16px;
    padding: 16px;
  }
}
</style>
