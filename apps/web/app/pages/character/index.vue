<template>
  <div>
    <div
      class="mx-auto flex max-w-screen-xl flex-col items-center justify-center"
    >
      <UiNicknameInput
        v-model="inputText"
        label="캐릭터 검색"
        placeholder="캐릭터명 입력"
        class="mx-auto mt-12 max-w-4xl px-4"
        @submit="onSearch"
      />
      <div class="mt-12 flex w-full max-w-screen-md flex-col gap-4">
        <div class="flex flex-col">
          <ClientOnly>
            <div
              v-if="favoriteList.length === 0 && historyList.length === 0"
              class="py-4 text-center text-lg text-lucidgray-medium"
            >
              검색기록이 없어요!
            </div>
            <div v-else class="flex flex-col">
              <template v-for="(entry, idx) in searchedFavorite" :key="idx">
                <UiSearchEntry :entry="entry" type="favorite" />
              </template>
              <div
                v-if="searchedFavorite.length > 0 && searchedHistory.length > 0"
                class="m-2 border-t border-lucidviolet-100"
              />
              <template
                v-for="(entry, idx) in searchedHistory.slice(0, 50)"
                :key="idx"
              >
                <UiSearchEntry :entry="entry" type="history" />
              </template>
            </div>
          </ClientOnly>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import hansearch from 'hangul-search'
import {
  convertEnglishToKorean,
  convertKoreanToEnglish,
} from 'typingchanger_easy'

const route = useRoute()
const router = useRouter()
const history = useHistoryStore()

useHead({
  title: '캐릭터검색 | lara.moe',
})

const inputText = ref<string>('')

// 검색기록 관련
const searchHistory = (list: object[]) => {
  // @ts-expect-error: items로 감싸서 반환되는데 타입에 미반영된듯?
  const res = hansearch(list, inputText.value, ['query']).items

  if (res.length > 0) return res

  // 결과가 없고 입력값이 영어뿐이면 한글변환 시도
  if (res.length === 0 && /^[a-zA-Z0-9]*$/.test(inputText.value)) {
    const hangul = convertEnglishToKorean(inputText.value)
    // @ts-expect-error: 같은이유로 예외
    return hansearch(list, hangul, ['query']).items
  }

  // 결과가 없고 입력값이 한글이면 영어변환 시도
  if (res.length === 0 && /^[가-힣]*$/.test(inputText.value)) {
    const english = convertKoreanToEnglish(inputText.value)
    // @ts-expect-error: 같은이유로 예외
    return hansearch(list, english, ['query']).items
  }

  return []
}
const favoriteList = computed(() => {
  return history.favorite
    .filter((entry) => entry.type === 'character')
    .map((entry) => ({ ...entry, isFavorite: true }))
})
const historyList = computed(() => {
  return history.history
    .filter((entry) => entry.type === 'character')
    .map((entry) => ({ ...entry, isFavorite: false }))
})
const searchedFavorite = computed(() => {
  return searchHistory(favoriteList.value)
})
const searchedHistory = computed(() => {
  return searchHistory(historyList.value)
})

const onSearch = () => {
  const nickname = inputText.value.trim()
  if (nickname) navigateTo(`/character/${encodeURIComponent(nickname)}`)
}

onActivated(async () => {
  const queryInput = route.query.input as string | undefined

  inputText.value = queryInput ?? ''

  router.replace({ query: { ...route.query, input: undefined } })
})
</script>
