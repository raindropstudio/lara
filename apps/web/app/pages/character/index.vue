<template>
  <div>
    <div
      class="mx-auto flex max-w-screen-xl flex-col items-center justify-center"
    >
      <div
        class="mx-auto mt-[70.5px] flex max-w-screen-xl items-center justify-center"
      >
        <div class="w-16 grow basis-1" />
        <input
          ref="input"
          placeholder=""
          type="text"
          class="max-w-screen-md grow border-b-2 border-lucidviolet-300 bg-gradient-to-r from-lucidviolet-300 to-lucidviolet-800 bg-clip-text text-center text-8xl font-bold text-transparent caret-sunnyorange placeholder:text-lucidviolet-300 focus:ring-0"
          :value="inputText"
          spellcheck="false"
          @input="inputEvent"
          @keyup.enter="onSearch"
        />
        <button
          class="grow basis-1 rounded-lg py-2 text-lucidviolet-400 hover:bg-lucidviolet-50 hover:text-sunnyorange"
          @click="onSearch"
        >
          <IconRightArrow class="size-16" />
        </button>
      </div>
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
import { createTypeStream, delay } from 'hangul-typing-animation'
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

const input = ref<HTMLInputElement | null>(null)
const inputText = ref<string>('')

const inputEvent = () => {
  if (input.value) {
    // 한글(자음, 모음, 완성형), 영어, 숫자만 허용
    const filteredValue = input.value.value.replace(
      /[^ㄱ-ㅎㅏ-ㅣ가-힣a-zA-Z0-9]/g,
      '',
    )
    input.value.value = filteredValue
    inputText.value = filteredValue
  }
}

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

// 타이핑 애니메이션 관련
const typeStream = createTypeStream({
  perChar: 100,
  perHangul: 200,
  perSpace: 50,
  perLine: 0,
  perDot: 150,
})

const deleteStream = async (
  text: string,
  callback: (typing: string) => void,
) => {
  for (let i = text.length; i >= 0; i--) {
    await delay(150)
    callback(text.slice(0, i))
  }
}

const placeholderMessages = [
  '캐릭터명입력',
  '라라모에',
  '소주에보드카',
  '섭주',
  '비숍화이팅!!',
  '메이플화이팅',
  '신.창.섭.',
  '앙헤카톤의주',
  '녜힁',
  '뾃뜚땵꺓뛞쫤',
  '(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧',
]

const typeAnimation = async () => {
  for (const message of placeholderMessages) {
    await delay(500)
    await typeStream(message, async (typing) => {
      if (input.value) input.value.placeholder = typing
    })
    await delay(500)
    await deleteStream(message, async (typing) => {
      if (input.value) input.value!.placeholder = typing
    })
  }
}

const onSearch = () => {
  navigateTo(`/character/${input.value?.value}`)
}

onMounted(() => {
  typeAnimation()
})

onActivated(async () => {
  const queryInput = route.query.input as string | undefined

  if (inputText.value) {
    inputText.value = queryInput ?? ''
  }

  if (input.value) {
    input.value.value = queryInput ?? ''
    input.value.focus()
    router.replace({ query: { ...route.query, input: undefined } })
  }
})
</script>
