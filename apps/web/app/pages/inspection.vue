<template>
  <main class="mx-auto max-w-screen-xl px-4 pb-20 pt-10 sm:px-8 sm:pt-16">
    <header class="text-center">
      <p
        class="mb-3 text-xs font-semibold tracking-[0.3em] text-lucidviolet-400"
      >
        PARTY INSPECTION
      </p>
      <h1
        class="text-4xl font-extrabold tracking-tight text-lucidviolet-700 sm:text-6xl"
      >
        군장검사
      </h1>
      <p class="mt-4 text-sm leading-6 text-lucidgray-dark">
        함께할 캐릭터의 장비와 능력치를 한눈에.<br class="sm:hidden" />
        최대 6명을 나란히 비교해 보세요.
      </p>
    </header>
    <UiNicknameInput
      id="inspection-names"
      v-model="input"
      label="군장검사 캐릭터 추가"
      placeholder="캐릭터명 입력"
      describedby="inspection-help"
      :invalid="Boolean(message)"
      class="mx-auto mb-12 mt-10 max-w-4xl"
      @submit="submit"
    >
      <p
        id="inspection-help"
        class="mt-4 min-h-5 text-center text-xs sm:text-sm"
        :class="message ? 'text-rose-600' : 'text-lucidgray-dark'"
        aria-live="polite"
      >
        {{ message || '여러 캐릭터는 쉼표나 공백으로 구분해 주세요.' }}
      </p>
    </UiNicknameInput>
    <template v-if="entries.length">
      <div
        class="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm text-lucidviolet-600"
      >
        <h2 class="font-semibold">
          비교 중인 캐릭터
          <span class="ml-1 text-lucidviolet-400"
            >{{ entries.length }} / 6</span
          >
        </h2>
        <button
          class="rounded-lg border border-lucidviolet-200 px-3 py-2 hover:bg-white disabled:opacity-50"
          :disabled="entries.some((entry) => entry.pending)"
          @click="refreshAll"
        >
          전체 갱신
        </button>
      </div>
      <div
        class="grid gap-3"
        style="grid-template-columns: repeat(auto-fit, minmax(150px, 1fr))"
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
      <div
        class="mb-3 mt-10 flex flex-wrap justify-between gap-2 text-xs text-lucidgray-dark"
      >
        <p>분홍색은 비교 중 가장 높은 수치 · 누락된 정보는 —</p>
        <p>표를 좌우로 밀어 모든 캐릭터를 확인하세요.</p>
      </div>
      <div
        class="mb-4 flex justify-end gap-2"
        role="group"
        aria-label="비교 보기 방식"
      >
        <button
          v-for="option in viewOptions"
          :key="option.value"
          class="rounded-lg border px-4 py-2 text-sm"
          :class="
            view === option.value
              ? 'border-lucidviolet-400 bg-lucidviolet-50 text-lucidviolet-700'
              : 'border-lucidviolet-100 text-lucidgray-dark'
          "
          :aria-pressed="view === option.value"
          @click="selectedView = option.value"
        >
          {{ option.label }}
        </button>
      </div>
      <InspectionComparison v-if="view === 'table'" :entries="entries" />
      <div v-else class="grid gap-6 md:grid-cols-2">
        <section v-for="entry in entries" :key="entry.nickname" class="min-w-0">
          <h3 class="mb-3 text-lg font-bold text-lucidviolet-600">
            {{ entry.nickname }}
          </h3>
          <InspectionComparison :entries="[entry]" />
        </section>
      </div>
      <p class="mt-4 text-xs leading-5 text-lucidgray-dark">
        직업과 버프, 자료의 갱신 시점에 따라 수치가 달라집니다. 전투력만으로
        실제 보스 기여도를 판단할 수는 없어요.
      </p>
    </template>
    <section
      v-else
      class="mx-auto flex max-w-2xl flex-col items-center rounded-3xl border border-dashed border-lucidviolet-200 px-6 py-12 text-center"
    >
      <img
        src="~/assets/spirit/ssun_logo.webp"
        alt=""
        class="mb-5 size-20 opacity-80"
      />
      <h2 class="text-lg font-semibold text-lucidviolet-600">
        파티원을 모아볼까요?
      </h2>
      <p class="mt-2 text-sm leading-6 text-lucidgray-dark">
        닉네임을 입력하면 전투력, 포스, 유니온과<br />현재 착용 장비를 함께
        확인할 수 있어요.
      </p>
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
