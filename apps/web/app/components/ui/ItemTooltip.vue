<template>
  <div
    ref="popupRef"
    class="relative inline-block"
    @mouseenter="visible = true"
    @mouseleave="visible = false"
  >
    <slot />
    <div
      v-if="visible && item"
      ref="popupFloating"
      :style="floatingStyles"
      class="pointer-events-none absolute left-0 top-0 z-30 w-64 overflow-visible rounded-md bg-white/50 p-2 text-xs font-light text-lucidviolet-900 ring-2 ring-lucidgray-light backdrop-blur-2xl"
    >
      <div v-if="showStarforce && item.starforce !== undefined" class="mt-2">
        <!-- 스타포스 수치만큼 별을 렌더링 -->
        <div class="mb-1 flex flex-col items-center">
          <div class="flex justify-center">
            <template
              v-for="index in Math.min(maxStarforce, 15)"
              :key="'star-' + index"
            >
              <IconStar
                :class="getStarColor(index, item?.starforceScrollFlag ?? false)"
              />
              <span
                v-if="index % 5 === 0 && index < Math.min(maxStarforce, 15)"
                class="mx-1"
              />
            </template>
          </div>
          <div
            v-if="maxStarforce > 15 && !item?.starforceScrollFlag"
            class="mt-1 flex justify-center"
          >
            <template
              v-for="index in maxStarforce - 15"
              :key="'star-second-' + index"
            >
              <IconStar :class="getStarColor(index + 15, false)" />
              <span
                v-if="(index + 15) % 5 === 0 && index + 15 < maxStarforce"
                class="mx-1"
              />
            </template>
          </div>
        </div>
      </div>

      <!-- (소울) 아이템 이름 (+몇 강인지) -->
      <div v-if="item.soulName" class="-mb-2 mt-2 text-center text-base">
        {{ getSoulPrefix }}
      </div>
      <div class="py-1 text-center text-lg font-bold">
        {{ item.name }}
        <span v-if="item.scrollUpgrade">(+{{ item.scrollUpgrade }})</span>
      </div>

      <!-- 점선 구분선 -->
      <hr class="my-2 border-t border-dashed border-gray-200" />

      <!-- 아이템 이미지, 장비 장착 레벨 -->
      <div class="mt-2 flex items-stretch space-x-2">
        <!-- 이미지 박스, 잠재능력 색에 따라 외곽선 변경 -->
        <div
          :class="getPotentialBorderColor(item.potentialOptionGrade)"
          class="flex size-16 items-center justify-center rounded-md border-2 bg-gray-50"
        >
          <img
            :src="getItemImageUrl(item.shapeIcon || item.icon)"
            alt="item.name"
            class="size-10 object-contain [image-rendering:pixelated]"
          />
        </div>
        <div class="flex flex-col items-start text-xs">
          <div class="min-h-4 font-semibold">
            {{
              displayedPotentialGrade ? displayedPotentialGrade + ' 아이템' : ''
            }}
          </div>
          <div class="font-semibold">
            REQ LEVEL : {{ item.baseOption?.baseEquipmentLevel || 0 }}
          </div>
          <div v-if="item.slot === '무기'">무기분류 : {{ item.part }}</div>
          <div v-else>장비분류 : {{ item.part }}</div>
          <div
            v-if="
              item.shapeName && item.shapeIcon && item.shapeIcon !== item.icon
            "
            class="mt-auto text-lucidgray-dark"
          >
            외형 : {{ item.shapeName }}
          </div>
        </div>
      </div>

      <!-- 기본 옵션 (STR, DEX, INT, LUK, HP, 공격력, 마력 등) -->
      <div v-if="computedStats.length > 0">
        <!-- 점선 구분선 -->
        <hr class="my-2 border-t border-dashed border-gray-200" />
        <div
          v-for="(stat, index) in computedStats"
          :key="index"
          :class="{
            //'text-gray-400': stat.breakdown.length <= 1,
            'text-cyan-500': stat.breakdown.length > 1,
          }"
          class="text-xs font-medium"
        >
          {{ stat.label }} :
          <span
            >+{{
              stat.isPercentage ? stat.totalValue + '%' : stat.totalValue
            }}</span
          >
          <span v-if="stat.breakdown.length > 1">
            <span class="text-gray-500"> (</span>
            <template v-for="(part, idx) in stat.breakdown" :key="idx">
              <span :class="optionTypeClassMap[part.type]"
                >{{ part.valueSign
                }}{{ stat.isPercentage ? part.value + '%' : part.value }}</span
              ><span v-if="idx < stat.breakdown.length - 1">&nbsp;</span>
            </template>
            <span class="text-gray-500">)</span>
          </span>
        </div>
      </div>

      <!-- 업그레이드 가능 횟수 -->
      <div v-if="scrollUpgradeableCount" class="text-lucidgray-dark">
        업그레이드 가능 횟수 : {{ scrollUpgradeableCount }}
        <span class="text-yellow-500">
          (복구 가능 횟수 : {{ scrollResilienceCount }})
        </span>
      </div>
      <div v-if="item.goldenHammerFlag" class="text-lucidgray-dark">
        황금망치 재련 적용
      </div>
      <div v-if="item.cuttableCount && item.cuttableCount !== 255">
        <span class="text-yellow-500"
          >가위 사용 가능 횟수 : {{ item.cuttableCount }}</span
        >
      </div>

      <!-- 잠재옵션 -->
      <div v-if="item.potentialOption && item.potentialOption.length > 0">
        <!-- 점선 구분선 -->
        <hr class="my-2 border-t border-dashed border-gray-200" />
        <div class="mb-1 flex items-center break-words font-semibold">
          <!-- 원 아이콘 -->
          <span
            class="mr-1 h-3 w-1 rounded-full"
            :class="getPotentialBackgroundColor(item.potentialOptionGrade)"
          />
          잠재옵션
        </div>
        <div
          v-for="(option, index) in item.potentialOption"
          :key="index"
          :class="item.potentialOptionGrade"
        >
          {{ option }}
        </div>
      </div>

      <!-- 에디셔널 잠재옵션 -->
      <div
        v-if="
          item.additionalPotentialOption &&
          item.additionalPotentialOption.length > 0
        "
      >
        <!-- 점선 구분선 -->
        <hr class="my-2 border-t border-dashed border-gray-200" />
        <div class="mb-1 flex items-center break-words font-semibold">
          <!-- 원 아이콘 -->
          <span
            class="mr-1 h-3 w-1 rounded-full"
            :class="
              getPotentialBackgroundColor(item.additionalPotentialOptionGrade)
            "
          />
          에디셔널 잠재옵션
        </div>
        <div
          v-for="(option, index) in item.additionalPotentialOption"
          :key="index"
        >
          {{ option }}
        </div>
      </div>

      <!-- 적용된 소울 옵션 -->
      <div v-if="item.soulName">
        <!-- 점선 구분선 -->
        <hr class="my-2 border-t border-dashed border-gray-200" />
        <div class="break-words font-semibold">
          {{ item.soulName }}
        </div>
        <div>
          {{ item.soulOption }}
        </div>
      </div>

      <!-- 익셉셔널 옵션 -->
      <div v-if="item.exceptionalOption?.exceptionalUpgrade">
        <!-- 점선 구분선 -->
        <hr class="my-2 border-t border-dashed border-gray-200" />
        <div class="mb-1 flex items-center break-words font-semibold">
          <!-- 원 아이콘 -->
          <span
            class="mr-1 h-3 w-1 rounded-full"
            :class="getPotentialBackgroundColor('EXCEPTIONAL')"
          />
          익셉셔널
        </div>
        <div>
          올스탯 : +{{ item.exceptionalOption.str }} <br />
          최대 HP / 최대 MP : +{{ item.exceptionalOption.maxHp }} <br />
          공격력 / 마력 : +{{ item.exceptionalOption.attackPower }} <br />
          <span class="text-lucidgray-dark">
            익셉셔널 강화 {{ item.exceptionalOption.exceptionalUpgrade }}회 적용
          </span>
        </div>
      </div>

      <!-- 아이템 설명 -->
      <div v-if="item.description">
        <!-- 점선 구분선 -->
        <hr class="my-2 border-t border-dashed border-gray-200" />
        <div class="whitespace-pre-wrap text-pretty break-words">
          {{ item.description }}
        </div>
        <!-- 시드링 레벨 -->
        <div v-if="item.specialRingLevel" class="font-medium text-yellow-500">
          {{ item.name }} Lv.{{ item.specialRingLevel }}
        </div>
      </div>

      <!-- 놀라운 장비강화 주문서 적용 -->
      <div v-if="item.starforceScrollFlag">
        <!-- 점선 구분선 -->
        <hr class="my-2 border-t border-dashed border-gray-200" />
        <div>놀라운 장비강화 주문서가 사용되었습니다.</div>
      </div>

      <!-- 컬러링 프리즘 -->
      <div v-if="item.coloringPrismRange">
        <!-- 점선 구분선 -->
        <hr class="my-2 border-t border-dashed border-gray-200" />
        <div class="whitespace-pre-wrap text-pretty break-words">
          <span>컬러링 프리즘이 적용된 아이템입니다.</span>
        </div>
        <div class="font-semibold">
          적용 범위 : {{ getPrismRangeText(item.coloringPrismRange) }} 계열
        </div>
        <div
          v-if="
            item.coloringPrismHue ||
            item.coloringPrismSaturation ||
            item.coloringPrismValue
          "
          class="font-semibold"
        >
          색조: {{ getPrismSignedValue(item.coloringPrismHue) }}, 채도:
          {{ getPrismSignedValue(item.coloringPrismSaturation) }}, 명도:
          {{ getPrismSignedValue(item.coloringPrismValue) }}
        </div>
      </div>

      <!-- 기간제 능력치 아이템 -->
      <div v-if="item.dateOptionExpire">
        <!-- 점선 구분선 -->
        <hr class="my-2 border-t border-dashed border-gray-200" />
        <div class="font-medium">
          <span v-if="isOptionExpired" class="text-red-500">
            옵션 기간 만료
          </span>
          <span v-else class="text-lucidgray-dark">
            {{ formatKoreanDateTime(item.dateOptionExpire) }}까지 옵션 사용가능
          </span>
        </div>
      </div>

      <!-- 기간제 아이템 -->
      <div v-if="item.dateExpire">
        <!-- 점선 구분선 -->
        <hr class="my-2 border-t border-dashed border-gray-200" />
        <div class="font-medium">
          <span v-if="isExpired" class="text-red-500"> 아이템 기간 만료 </span>
          <span v-else class="text-lucidgray-dark">
            {{ formatKoreanDateTime(item.dateExpire) }}까지 사용가능
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  autoUpdate,
  limitShift,
  offset,
  shift,
  useFloating,
} from '@floating-ui/vue'

const props = defineProps<{
  item: ItemEquipmentInfo | undefined
}>()

const { item } = toRefs(props)
const visible = ref(false)

const popupRef = ref<HTMLElement | null>(null)
const popupFloating = ref<HTMLElement | null>(null)
const { floatingStyles } = useFloating(popupRef, popupFloating, {
  whileElementsMounted: autoUpdate,
  placement: 'right-start',
  middleware: [
    offset(10),
    shift({
      crossAxis: true,
      limiter: limitShift(),
    }),
  ],
})

/**
 * 복구 가능 횟수가 undefined일 경우 0으로 변환
 */
const scrollResilienceCount = computed(
  () => item.value?.scrollResilienceCount || 0,
)

// 스타포스 표시 여부 (엠블렘, 훈장 같은 스타포스가 적용되지 않는 아이템 제외)
const showStarforce = computed(() => {
  const nonStarforceItems = ['엠블렘', '훈장', '뱃지', '포켓 아이템']
  return (
    item.value &&
    !nonStarforceItems.includes(item.value.part) &&
    item.value.starforce !== null
  )
})

// 아이템 레벨에 따른 최대 스타포스 계산
const maxStarforce = computed(() => {
  const level = item.value?.baseOption?.baseEquipmentLevel || 0

  // 슈페리얼 아이템인지 확인 (특정 단어가 이름에 포함된 경우)
  const isSuperior =
    item.value?.name.includes('타일런트') ||
    item.value?.name.includes('슈페리얼')

  if (isSuperior) {
    if (level < 95) return 3
    if (level < 108) return 5
    if (level < 118) return 8
    if (level < 128) return 10
    if (level < 138) return 12
    return 15
  }

  // 일반 아이템의 경우
  if (level < 95) return 5
  if (level < 108) return 8
  if (level < 118) return 10
  if (level < 128) return 15
  if (level < 138) return 20
  return 30
})

/**
 * 무기 이름 위에 들어갈 소울 이름 파싱 ("위대한 매그너스의 소울"이면, "위대한 매그너스의"만 반환)
 */
const getSoulPrefix = computed(() => {
  if (item.value?.soulName) {
    return item.value.soulName.replace(' 소울 적용', '')
  }
  return ''
})

/**
 * 영어 등급을 한글 등급으로 변환하는 매핑 객체
 */
const gradeMap: { [key: string]: string } = {
  LEGENDARY: '레전드리',
  UNIQUE: '유니크',
  EPIC: '에픽',
  RARE: '레어',
}

/**
 * 강화 가능 횟수 계산
 */
const scrollUpgradeableCount = computed(() => {
  if (
    item.value?.scrollUpgradeableCount !== undefined &&
    item.value?.scrollUpgrade !== undefined
  ) {
    return item.value.scrollUpgradeableCount
  } else if (
    item.value?.scrollUpgradeableCount === undefined &&
    item.value?.scrollUpgrade !== undefined
  ) {
    return '0'
  } else {
    return undefined
  }
})

/**
 * 잠재 능력 등급 한글 매핑
 */
const displayedPotentialGrade = computed(() => {
  if (item.value?.potentialOptionGrade) {
    return (
      gradeMap[item.value.potentialOptionGrade] ||
      item.value.potentialOptionGrade
    )
  }
  if (item.value?.additionalPotentialOptionGrade) {
    return (
      gradeMap[item.value.additionalPotentialOptionGrade] ||
      item.value.additionalPotentialOptionGrade
    )
  }
  return ''
})

/**
 * 기본 옵션들을 표시하기 위한 배열
 */
const statsToDisplay = [
  { key: 'str', label: 'STR', isPercentage: false },
  { key: 'dex', label: 'DEX', isPercentage: false },
  { key: 'int', label: 'INT', isPercentage: false },
  { key: 'luk', label: 'LUK', isPercentage: false },
  { key: 'maxHp', label: 'HP', isPercentage: false },
  { key: 'maxMp', label: 'MP', isPercentage: false },
  { key: 'maxHpRate', label: '최대 HP', isPercentage: true },
  { key: 'maxMpRate', label: '최대 MP', isPercentage: true },
  { key: 'attackPower', label: '공격력', isPercentage: false },
  { key: 'magicPower', label: '마력', isPercentage: false },
  {
    key: 'equipmentLevelDecrease',
    label: '착용 레벨 감소',
    isPercentage: false,
  },
  { key: 'armor', label: '방어력', isPercentage: false },
  { key: 'speed', label: '이동속도', isPercentage: false },
  { key: 'jump', label: '점프력', isPercentage: false },
  {
    key: 'bossDamage',
    label: '보스 몬스터 공격 시 데미지',
    isPercentage: true,
  },
  {
    key: 'ignoreMonsterArmor',
    label: '몬스터 방어율 무시',
    isPercentage: true,
  },
  { key: 'allStat', label: '올스탯', isPercentage: true },
  { key: 'damage', label: '데미지', isPercentage: true },
]

/**
 * 각 옵션의 총합과 세부 내역을 계산하여 배열로 반환
 */
const computedStats = computed(() => {
  if (!item.value) {
    return []
  }

  const stats = []

  for (const stat of statsToDisplay) {
    const totalValue =
      item.value.totalOption?.[stat.key as keyof ItemOption] || 0

    if (totalValue !== 0) {
      const breakdown = []

      const baseValue =
        item.value.baseOption?.[stat.key as keyof ItemOption] || 0
      const addValue = item.value.addOption?.[stat.key as keyof ItemOption] || 0
      const etcValue = item.value.etcOption?.[stat.key as keyof ItemOption] || 0
      const starforceValue =
        item.value.starforceOption?.[stat.key as keyof ItemOption] || 0

      if (baseValue >= 0) {
        breakdown.push({
          value: baseValue,
          type: 'base',
          valueSign: baseValue >= 0 ? '' : '-',
        })
      }
      if (addValue !== 0) {
        breakdown.push({
          value: addValue,
          type: 'add',
          valueSign: addValue > 0 ? '+' : '-',
        })
      }
      if (etcValue !== 0) {
        breakdown.push({
          value: etcValue,
          type: 'etc',
          valueSign: etcValue > 0 ? '+' : '-',
        })
      }
      if (starforceValue !== 0) {
        breakdown.push({
          value: starforceValue,
          type: 'starforce',
          valueSign: starforceValue > 0 ? '+' : '',
        })
      }

      stats.push({
        label: stat.label,
        totalValue,
        isPercentage: stat.isPercentage,
        breakdown,
      })
    }
  }
  return stats
})

/**
 * 옵션 유형별 CSS 클래스 매핑
 */
const optionTypeClassMap: { [key: string]: string } = {
  base: 'text-gray-600',
  add: 'text-green-500',
  etc: 'text-gray-500',
  starforce: 'text-yellow-500',
}

/**
 * 잠재능력에 따라 외곽선 색상 반환
 */
const getPotentialBorderColor = (grade: string | undefined) => {
  switch (grade) {
    case 'LEGENDARY':
      return 'border-potential-legendary' // 레전드리 - 초록색
    case 'UNIQUE':
      return 'border-potential-unique' // 유니크 - 노란색
    case 'EPIC':
      return 'border-potential-epic' // 에픽 - 보라색
    case 'RARE':
      return 'border-potential-rare' // 레어 - 파란색
    default:
      return 'border-potential-normal' // 기본 - 회색
  }
}

/**
 * 잠재능력에 따라 원 아이콘의 배경색 반환
 */
const getPotentialBackgroundColor = (grade: string | undefined) => {
  switch (grade) {
    case 'LEGENDARY':
      return 'bg-potential-legendary'
    case 'UNIQUE':
      return 'bg-potential-unique'
    case 'EPIC':
      return 'bg-potential-epic'
    case 'RARE':
      return 'bg-potential-rare'
    case 'EXCEPTIONAL':
      return 'bg-potential-exceptional'
    default:
      return 'bg-potential-normal'
  }
}

// 별 색상 결정 함수
const getStarColor = (index: number, isScrollFlag: boolean) => {
  if (isScrollFlag) {
    return {
      'size-3': true,
      'text-blue-500': index <= (item.value?.starforce ?? 0), // 놀장강 파란별
    }
  } else {
    return {
      'size-3': true,
      'text-yellow-500': index <= (item.value?.starforce ?? 0), // 기존 색상
      'text-gray-300': index > (item.value?.starforce ?? 0),
    }
  }
}

/**
 * 컬러링 프리즘 범위를 한글로 변환
 */
const getPrismRangeText = (range: string) => {
  const rangeMap: Record<string, string> = {
    ALL: '전체 색상',
    RED: '빨간색',
    YELLOW: '노란색',
    GREEN: '초록색',
    CYAN: '청록색',
    BLUE: '파란색',
    PURPLE: '보라색',
  }
  return rangeMap[range] || range
}

/**
 * 프리즘 값 앞에 +/- 기호를 붙여서 반환 (NXAPI에서 양수일 때는 +기호를 반환하지 않지만, 음수일 때는 -기호를 반환하는 문제를 일괄적으로 해결)
 */
const getPrismSignedValue = (value: number | undefined) => {
  if (value === undefined) return '+0'
  return value >= 0 ? `+${value}` : `${value}`
}

/**
 * 기간제 능력치 옵션이 만료되었는지 확인
 */
const isOptionExpired = computed(() => {
  if (!item.value?.dateOptionExpire) return false
  return new Date(item.value.dateOptionExpire) < new Date()
})

/**
 * 기간제 아이템이 만료되었는지 확인
 */
const isExpired = computed(() => {
  if (!item.value?.dateExpire) return false
  return new Date(item.value.dateExpire) < new Date()
})
</script>
