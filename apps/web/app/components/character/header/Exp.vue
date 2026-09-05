<template>
  <div
    class="bg-gradient-to-r from-lucid-light to-lucidviolet-500 to-10% bg-clip-text font-thin text-transparent"
  >
    <span>#</span>
    <UiTooltip>
      <span class="inline-block cursor-help text-lucidviolet-500">
        {{ levelText }}
      </span>
      <template #tooltip>
        <div>레벨 {{ character?.level }} + 경험치 {{ characterExpText }}</div>
      </template>
    </UiTooltip>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  character: Character | undefined
}>()

const { character } = toRefs(props)

const tagText = [
  { level: 290, text: '운명을 거스르는 대적자' },
  { level: 285, text: '영원의 나무를 지켜낸 자' },
  { level: 280, text: '다시 만나길 기약하며' },
  { level: 275, text: '낙원에 도달한 사람' },
  { level: 270, text: '혼돈의 눈을 감긴 자' },
  { level: 265, text: '가장 느리지만 가장 빠른 자' },
  { level: 260, text: '구원은 그대의 손아귀에' },
  { level: 255, text: '운명을 넘어선 자' },
  { level: 250, text: '영원의 늪에서 일어난 빛' },
  { level: 245, text: '공허를 극복한 자' },
  { level: 240, text: '별을 삼킨 고래' },
  { level: 235, text: '진실을 꿰뚫는 자' },
  { level: 230, text: '기억의 늪에서' },
  { level: 225, text: '돌의정령 귀여워' },
  { level: 220, text: '악몽과 나비와 꿈' },
  { level: 215, text: '나는 단추가 싫다' },
  { level: 210, text: '무토의 짱친' },
  { level: 205, text: '나와 지하철의 행방불명' },
  { level: 200, text: '흩어진 기억을 모아' },
  { level: 101, text: '전도유망한' },
  { level: 1, text: '여긴어디 나는누구' },
]

const levelText = computed(() => {
  if (!character.value) return ''
  return (
    tagText.find((tag) => (character.value?.level ?? 0) >= tag.level)?.text ||
    ''
  )
})

const characterExpText = computed(() => {
  if (!character.value) return 0
  // 먼 미래에 safeint 벗어나면 bigint로 바꾸기
  return formatToKoreanNumber(parseInt(character.value.exp))
})
</script>
