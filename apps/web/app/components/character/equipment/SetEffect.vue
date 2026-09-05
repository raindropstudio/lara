<template>
  <div class="flex items-center gap-3">
    <div class="flex gap-2">
      <template v-for="(set, idx) in armorSetEffect" :key="idx">
        <UiSetEffectTooltip :set-effect="set">
          <div class="flex items-center">
            <div class="cursor-default text-5xl font-thin text-lucidviolet-700">
              {{ set.setCount }}
            </div>
            <img
              v-if="set.setIcon"
              :src="getItemImageUrl(set.setIcon)"
              :alt="set.setName"
              class="-ml-2 max-w-10 [image-rendering:pixelated]"
            />
          </div>
        </UiSetEffectTooltip>
      </template>
    </div>
    <div
      v-if="armorSetEffect.length > 0 || accessorySetEffect.length > 0"
      class="h-8 w-px bg-lucidgray-light"
    />
    <div class="flex gap-2">
      <template v-for="(set, idx) in accessorySetEffect" :key="idx">
        <UiSetEffectTooltip :set-effect="set">
          <div class="flex items-center">
            <div class="cursor-default text-5xl font-thin text-lucidviolet-700">
              {{ set.setCount }}
            </div>
            <img
              v-if="set.setIcon"
              :src="getItemImageUrl(set.setIcon)"
              :alt="set.setName"
              class="-ml-2 max-w-10 [image-rendering:pixelated]"
            />
          </div>
        </UiSetEffectTooltip>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  activePreset: ItemEquipmentInfo[] | undefined
  setEffect: SetEffect[]
}>()

const { activePreset, setEffect } = toRefs(props)

interface SetEffectResult {
  setName: string
  setCount: number
  setIcon: string | null
  setOptionList: SetOption[]
}

const createSetEffect = (
  setD: { setNamePrefix: string },
  getMainItem: (activePreset: ItemEquipmentInfo[]) => ItemEquipmentInfo | null,
): SetEffectResult | null => {
  const curSetEffect = setEffect.value.find((set) =>
    set.setName.includes(setD.setNamePrefix),
  )

  if (!curSetEffect || curSetEffect.setCount <= 1) {
    return null
  }

  // 세트효과 대표 아이템 추출
  // 아이템 리스트 앞부터 검색하기
  const item = getMainItem(activePreset.value ?? [])

  return {
    setName: setD.setNamePrefix,
    setCount: curSetEffect.setCount,
    setIcon: item?.icon ?? null,
    setOptionList: curSetEffect.setOptionList,
  }
}

// 장비 셋옵 추출
const armorSetEffect = computed(() => {
  const result: SetEffectResult[] = []

  const setData = [
    {
      setNamePrefix: '에테르넬 세트',
      prefix: ['에테르넬'],
      partList: ['모자', '상의', '하의', '장갑', '어깨장식', '망토', '신발'],
    },
    {
      setNamePrefix: '아케인셰이드 세트',
      prefix: ['아케인셰이드'],
      partList: ['무기', '모자', '한벌옷', '장갑', '어깨장식', '망토', '신발'],
    },
    {
      setNamePrefix: '앱솔랩스 세트',
      prefix: ['앱솔랩스'],
      partList: ['무기', '모자', '한벌옷', '장갑', '어깨장식', '망토', '신발'],
    },
    {
      setNamePrefix: '도전자의 장비 세트',
      prefix: ['도전자의'],
      partList: [
        '무기',
        '모자',
        '상의',
        '하의',
        '장갑',
        '어깨장식',
        '망토',
        '신발',
      ],
    },
    {
      setNamePrefix: '루타비스 세트',
      prefix: ['파프니르', '하이네스', '이글아이', '트릭스터'],
      partList: ['무기', '모자', '상의', '하의'],
    },
    {
      setNamePrefix: '시그너스 여제 세트',
      prefix: ['라이온하트', '드래곤테일', '팔콘윙', '레이븐혼', '샤크투스'],
      partList: ['무기', '모자', '한벌옷', '장갑', '어깨장식', '망토', '신발'],
    },
    {
      setNamePrefix: '네크로 세트',
      prefix: ['네크로', '워리어', '매지션', '센티널', '체이서', '스키퍼'],
      partList: ['무기', '모자', '한벌옷', '장갑', '어깨장식', '망토', '신발'],
    },
  ]

  for (const setD of setData) {
    const setEffect = createSetEffect(setD, (items) => {
      // partList 순서대로 해당 리스트에 속한 첫번째 아이템 반환
      for (const part of setD.partList) {
        const item = items.find(
          (item) =>
            item.part === part &&
            setD.prefix.some((prefix) => item.name.includes(prefix)),
        )
        if (item) {
          return item
        }
      }

      return null
    })

    if (setEffect) {
      result.push(setEffect)
    }
  }

  return result
})

// 장신구 셋옵 추출
const accessorySetEffect = computed(() => {
  const result: SetEffectResult[] = []

  const setData = [
    {
      setNamePrefix: '광휘의 보스 세트',
      itemListPrefix: ['근원의 속삭임', '죽음의 맹세', '불멸의 유산'],
    },
    {
      setNamePrefix: '칠흑의 보스 세트',
      itemListPrefix: [
        '컴플리트 언더컨트롤',
        '창세의 뱃지',
        '의 마도서',
        '거대한 공포',
        '고통의 근원',
        '커맨더 포스 이어링',
        '몽환의 벨트',
        '루즈 컨트롤 머신 마크',
        '마력이 깃든 안대',
        '블랙 하트',
      ],
    },
    {
      setNamePrefix: '여명의 보스 세트',
      itemListPrefix: [
        '여명의 가디언 엔젤 링',
        '데이브레이크 펜던트',
        '에스텔라 이어링',
        '트와일라이트 마크',
      ],
    },
    {
      setNamePrefix: '보스 장신구 세트',
      itemListPrefix: [
        '도미네이터',
        '핑크빛 성배',
        '아쿠아틱',
        '블랙빈 마크',
        '응축된 힘의',
        '골든 클로버',
        '분노한 자쿰의 벨트',
        '혼테일의',
        '매커네이터',
        '데아 시두스',
        '지옥의 불꽃',
        '실버블라썸',
        '고귀한 이피아',
        '크리스탈 웬투스',
        '로얄 블랙메탈',
        '영생의 돌',
      ],
    },
    {
      setNamePrefix: '마이스터 세트',
      itemListPrefix: ['마이스터'],
    },
    {
      setNamePrefix: '칠요 세트',
      itemListPrefix: ['칠요'],
    },
    {
      setNamePrefix: '이피아의 보물 세트',
      itemListPrefix: ['이피아'],
    },
  ]

  for (const setD of setData) {
    const setEffect = createSetEffect(setD, (items) => {
      // itemListPrefix 순서대로 검색
      for (const prefix of setD.itemListPrefix) {
        const item = items.find((item) => item.name.includes(prefix))
        if (item) {
          return item
        }
      }

      return null
    })

    if (setEffect) {
      result.push(setEffect)
    }
  }

  return result
})
</script>
