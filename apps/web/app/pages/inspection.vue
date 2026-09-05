<template>
  <main class="inspection-page">
    <header class="inspection-heading">
      <h1>군장검사</h1>
      <p v-if="!entries.length">
        함께할 캐릭터의 장비와 능력치를 나란히 확인하세요.
      </p>
    </header>
    <UiNicknameInput
      id="inspection-names"
      v-model="input"
      label="군장검사 캐릭터 추가"
      placeholder="캐릭터명 입력"
      describedby="inspection-help"
      :invalid="Boolean(message)"
      class="inspection-input"
      :class="{ 'is-compact': entries.length }"
      @submit="submit"
    >
      <p
        id="inspection-help"
        class="input-help"
        :class="{ 'text-rose-600': message }"
        aria-live="polite"
      >
        {{
          message ||
          (entries.length
            ? '쉼표로 구분해 캐릭터 추가'
            : '최대 6명 · 여러 캐릭터는 쉼표나 공백으로 구분해 주세요.')
        }}
      </p>
    </UiNicknameInput>
    <template v-if="entries.length">
      <div class="inspection-toolbar">
        <span>{{ entries.length }} / 6명</span>
        <div class="flex items-center gap-4">
          <button
            :disabled="entries.some((entry) => entry.pending)"
            @click="refreshAll"
          >
            전체 갱신 ↻
          </button>
          <div role="group" aria-label="비교 보기 방식" class="flex gap-3">
            <button
              v-for="option in viewOptions"
              :key="option.value"
              :aria-pressed="view === option.value"
              @click="selectedView = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
      </div>
      <div
        v-if="view === 'table'"
        class="inspection-scroll"
        role="region"
        aria-label="파티 비교, 좌우로 스크롤할 수 있습니다"
        tabindex="0"
      >
        <div :style="{ minWidth: `${entries.length * 160}px` }">
          <div
            class="inspection-roster"
            :style="{
              gridTemplateColumns: `repeat(${entries.length}, minmax(0, 1fr))`,
            }"
          >
            <InspectionCharacterCard
              v-for="(entry, index) in entries"
              :key="entry.nickname"
              :entry="entry"
              :first="index === 0"
              :last="index === entries.length - 1"
              @remove="remove(entry.nickname)"
              @refresh="refresh(entry.nickname)"
              @move="move(entry.nickname, $event)"
            />
          </div>
          <InspectionComparison :entries="entries" />
        </div>
      </div>
      <div v-else class="inspection-cards">
        <section
          v-for="(entry, index) in entries"
          :key="entry.nickname"
          class="min-w-0"
        >
          <InspectionCharacterCard
            :entry="entry"
            :first="index === 0"
            :last="index === entries.length - 1"
            @remove="remove(entry.nickname)"
            @refresh="refresh(entry.nickname)"
            @move="move(entry.nickname, $event)"
          />
          <InspectionComparison :entries="[entry]" />
        </section>
      </div>
      <p class="inspection-footnote">
        분홍색은 비교 중 가장 높은 수치 · 확인할 수 없는 정보는 —<br />직업과
        버프, 자료의 기준 시각에 따라 수치가 달라지며 보스 기여도를 판정하지
        않습니다.
      </p>
    </template>
    <section v-else class="inspection-empty">
      <img src="~/assets/spirit/ssun_logo.webp" alt="" />
      <h2>파티원을 모아볼까요?</h2>
      <p>캐릭터명 입력으로 군장검사를 시작하세요.</p>
    </section>
  </main>
</template>
<script setup lang="ts">
const { entries, message, add, refresh, remove, move } = useInspection()
const input = ref('')
const mobile = useMediaQuery('(max-width: 639px)')
const selectedView = ref<'table' | 'cards' | null>(null)
const view = computed(
  () => selectedView.value ?? (mobile.value ? 'cards' : 'table'),
)
const viewOptions = [
  { value: 'table', label: '표 보기' },
  { value: 'cards', label: '카드 보기' },
] as const
useHead({ title: '군장검사 | lara.moe' })
const submit = () => {
  if (add(input.value)) input.value = ''
}
const refreshAll = () => {
  for (const entry of entries.value) void refresh(entry.nickname)
}
</script>
<style scoped>
.inspection-page {
  max-width: 1280px;
  margin: 0 auto;
  padding: 56px 24px 80px;
  color: #858297;
}
.inspection-heading {
  text-align: center;
}
.inspection-heading h1 {
  font-size: clamp(40px, 5vw, 76px);
  font-weight: 800;
  letter-spacing: -0.055em;
  line-height: 1.2;
  background: linear-gradient(110deg, #c9c9cd, #a6a6ae);
  background-clip: text;
  color: transparent;
}
.inspection-heading p {
  margin-top: 20px;
  font-size: 14px;
}
.inspection-input {
  max-width: 850px;
  margin: 44px auto 64px;
}
.inspection-input.is-compact {
  max-width: 340px;
  margin: 22px auto 24px;
}
.is-compact :deep(input) {
  font-size: 18px;
  padding: 6px 0;
  border-bottom-width: 1px;
}
.is-compact :deep(button) {
  width: 28px;
  height: 32px;
}
.is-compact :deep(svg) {
  width: 24px;
  height: 24px;
}
.input-help {
  margin-top: 10px;
  text-align: center;
  font-size: 12px;
  color: #aaa8b6;
}
.input-help.text-rose-600 {
  color: #e34c69;
}
.inspection-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 12px;
  color: #a19cae;
}
.inspection-toolbar button {
  min-height: 32px;
}
.inspection-toolbar button:hover,
.inspection-toolbar button[aria-pressed='true'] {
  color: #787090;
}
.inspection-toolbar button:disabled {
  opacity: 0.4;
}
.inspection-scroll {
  overflow-x: auto;
}
.inspection-roster {
  display: grid;
}
.inspection-cards {
  display: grid;
  gap: 48px;
}
.inspection-footnote {
  margin-top: 32px;
  font-size: 12px;
  text-align: center;
  line-height: 1.9;
  color: #aaa8b6;
}
.inspection-empty {
  padding: 30px 0;
  text-align: center;
}
.inspection-empty img {
  width: 72px;
  margin: 0 auto 24px;
  opacity: 0.65;
}
.inspection-empty h2 {
  font-size: 20px;
  font-weight: 600;
}
.inspection-empty p {
  font-size: 13px;
  margin-top: 10px;
}
@media (max-width: 639px) {
  .inspection-page {
    padding: 32px 16px 60px;
  }
  .inspection-input.is-compact {
    margin-bottom: 28px;
  }
  .inspection-toolbar {
    font-size: 11px;
  }
}
</style>
