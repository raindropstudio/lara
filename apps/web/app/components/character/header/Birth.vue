<template>
  <div>
    <span
      class="bg-gradient-to-r from-lucid-light to-lucidviolet-500 to-40% bg-clip-text font-thin text-transparent"
      >#모험
    </span>
    <UiTooltip>
      <span class="cursor-help">
        <span
          v-if="birth.text === '주년'"
          class="bg-gradient-to-tr from-sunnyorange to-yellow-300 bg-clip-text font-medium text-transparent"
        >
          <IconPopper class="-mx-2 inline size-9 text-sunnyorange" />
          {{ birth.number }}{{ birth.text }}
          <IconPopper
            class="-mx-2 inline size-9 -scale-x-100 text-sunnyorange"
          />
        </span>
        <span v-else class="text-lucidviolet-500">
          {{ birth.number }}<span class="font-thin">{{ birth.text }}</span>
        </span>
      </span>
      <template #tooltip>
        <div>
          캐릭터 생성일:
          {{
            character?.dateCreate
              ? new Date(character?.dateCreate).toLocaleDateString()
              : '캐릭터 생성일을 가져오는데 오류가 발생했어요'
          }}
        </div>
      </template>
    </UiTooltip>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  character: Character | undefined
}>()

const { character } = toRefs(props)

// 캐릭터 누적일수
const birth = computed(() => {
  if (!character.value) return { number: 0, text: '을 언제 시작했더라' }
  const created = new Date(character.value.dateCreate)
  const now = new Date()
  const kstNow = new Date(
    now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }),
  )

  if (
    kstNow.getFullYear() > created.getFullYear() &&
    kstNow.getMonth() === created.getMonth() &&
    kstNow.getDate() === created.getDate()
  ) {
    return {
      number: kstNow.getFullYear() - created.getFullYear(),
      text: '주년',
    }
  }

  const diff = now.getTime() - created.getTime()
  return {
    number: Math.floor(diff / (1000 * 60 * 60 * 24)),
    text: '일 차',
  }
})
</script>
