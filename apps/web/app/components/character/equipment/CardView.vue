<template>
  <div>
    <div class="grid grid-cols-3 gap-3">
      <template v-for="(item, idx) in mappedPreset" :key="idx">
        <UiItemTooltip :item="item">
          <div
            class="flex h-11 items-center justify-start rounded bg-gray-50 py-1 pr-2 ring-gray-300 drop-shadow-sm transition-all duration-700 ease-in-out hover:bg-gray-100"
            :class="[itemChanged[idx] ? '' : 'ring-1']"
          >
            <div class="flex w-12 items-center justify-center">
              <img
                :src="getItemImageUrl(item.icon)"
                :alt="item.name"
                class="drop-shadow-md [image-rendering:_pixelated]"
              />
            </div>
            <div
              class="flex flex-col gap-0.5 text-xs font-light text-lucidgray-dark"
            >
              <div class="flex flex-col">
                <div
                  v-if="item.starforce || getAddOptionGrade(item)"
                  class="line-clamp-1"
                >
                  {{ item.starforce ? item.starforce + '성' : '' }}
                  {{ item.starforce && getAddOptionGrade(item) ? ' | ' : '' }}
                  {{ getAddOptionGrade(item) }}
                  {{
                    (item.starforce || getAddOptionGrade(item)) &&
                    getUpgrade(item)
                      ? ' | '
                      : ''
                  }}
                  {{ getUpgrade(item) }}
                </div>
                <div v-else class="line-clamp-1">
                  {{ item.name }}
                </div>
              </div>
              <div class="flex flex-nowrap items-center justify-start gap-1">
                <template
                  v-for="(content, pidx) in getPotentialLine(item)"
                  :key="pidx"
                >
                  <div
                    class="flex items-center gap-[3px] font-normal text-lucidgray-dark"
                  >
                    <div
                      class="h-3 w-1 rounded-full"
                      :class="getPotentialColor(content.color)"
                    />
                    <div class="line-clamp-1">
                      {{ content.text }}
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </UiItemTooltip>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  viewPreset: ItemEquipmentInfo[] | undefined
  mainStatName: string
  atkStat: string
}>()

const { viewPreset, mainStatName, atkStat } = toRefs(props)

const cardViewMap = [
  '무기',
  '보조무기',
  '엠블렘',
  '모자',
  '상의',
  '하의',
  '장갑',
  '신발',
  '망토',
  '어깨장식',
  '벨트',
  '귀고리',
  '얼굴장식',
  '눈장식',
  '펜던트2',
  '펜던트',
  '반지4',
  '반지3',
  '반지2',
  '반지1',
  '기계 심장',
  '포켓 아이템',
  '뱃지',
  '훈장',
  '칭호',
]

const mappedPreset = computed(() => {
  return cardViewMap
    .map((slot) => viewPreset.value?.find((equip) => equip.slot === slot))
    .filter((equip) => !!equip)
})

// 아이템 부드럽게 변경
const itemChanged = ref(new Array(cardViewMap.length).fill(false))
watch(
  () => mappedPreset.value,
  (newPreset, oldPreset) => {
    newPreset.forEach((item, idx) => {
      if (item?.icon !== oldPreset[idx]?.icon) {
        itemChanged.value[idx] = true
        setTimeout(() => {
          itemChanged.value[idx] = false
        }, 300)
      }
    })
  },
)

// 무기추옵
const getWeaponAddOption = (item: ItemEquipmentInfo) => {
  if (!item.baseOption || !item.addOption) return null
  const baseAtkOption =
    atkStat.value === '마력'
      ? item.baseOption.magicPower
      : item.baseOption.attackPower
  const atkOption =
    atkStat.value === '마력'
      ? item.addOption.magicPower
      : item.addOption.attackPower
  if (!atkOption) return null
  let optionText = ''

  // [순수공마/100 * (렙제/40 몫 + 1) * 추옵단계 * 1.1^(추옵단계-3)] 소수점 올림
  for (const grade of [7, 6, 5, 4, 3]) {
    const calcOption = Math.ceil(
      ((baseAtkOption ?? 0) / 100) *
        (Math.floor((item.baseOption?.baseEquipmentLevel ?? 0) / 40) + 1) *
        grade *
        Math.pow(1.1, grade - 3),
    )
    if (calcOption === atkOption) {
      optionText = 8 - grade + '추'
      break
    }
  }

  if (
    optionText &&
    (item.addOption.bossDamage ||
      item.addOption.damage ||
      item.addOption.allStat)
  ) {
    optionText += ' + '
  }
  if (item.addOption.bossDamage) optionText += '보'
  if (item.addOption.damage) optionText += '뎀'
  if (item.addOption.allStat) optionText += '올'
  if (optionText.endsWith('보')) optionText += '공'

  return optionText
}

// 추옵
const getAddOptionGrade = (item: ItemEquipmentInfo) => {
  if (item.slot === '무기') return getWeaponAddOption(item)
  const addOption = item.addOption
  const mainStat = mainStatName.value?.toLowerCase() as
    'str' | 'dex' | 'int' | 'luk' | 'hp' | 'mix'
  if (!addOption || !mainStat) return null

  if (mainStat === 'hp') {
    const hpOption = addOption.maxHp ?? 0
    const atkOption = addOption.attackPower ?? 0
    const reqLevel = item.baseOption?.baseEquipmentLevel ?? 0

    for (const grade of [1, 2, 3, 4, 5]) {
      const calcOption = Math.floor(reqLevel / 10) * 10 * (8 - grade) * 3
      if (calcOption === hpOption) {
        return grade + '추' + (atkOption ? ' + ' + '공' + atkOption : '')
      }
    }
    return atkOption ? '공' + atkOption : null
  }

  if (mainStat === 'mix') {
    const allStatOption = addOption.allStat ?? 0
    const strOption = addOption.str ?? 0
    const dexOption = addOption.dex ?? 0
    const lukOption = addOption.luk ?? 0
    const atkOption = addOption.attackPower ?? 0

    const res =
      (strOption + dexOption + lukOption + allStatOption * 20 + atkOption * 6) /
      2
    if (res === 0) return null
    return res.toFixed(0) + '급'
  }

  const mainOption = addOption[mainStat] ?? 0
  const allStatOption = addOption.allStat ?? 0
  const atkOption =
    atkStat.value === '마력'
      ? addOption.magicPower || 0
      : addOption.attackPower || 0

  if (mainOption === 0 && allStatOption === 0 && atkOption === 0) return null
  return mainOption + allStatOption * 10 + atkOption * 4 + '급'
}

// 작
const getUpgrade = (item: ItemEquipmentInfo) => {
  if (!item.etcOption) return null
  const count = item.scrollUpgrade ?? 0
  if (count === 0) return null
  const mainStat = mainStatName.value?.toLowerCase() as
    'str' | 'dex' | 'int' | 'luk' | 'hp'

  let mainStatUpgrade = 0
  if (mainStat === 'hp') mainStatUpgrade = (item.etcOption.maxHp ?? 0) / count
  else mainStatUpgrade = (item.etcOption[mainStat] ?? 0) / count

  const mainAtkUpgrade =
    ((atkStat.value === '마력'
      ? item.etcOption.magicPower
      : item.etcOption.attackPower) ?? 0) / count
  const upgradable =
    !!item.scrollResilienceCount || !!item.scrollUpgradeableCount

  // 주흔작
  // 방어구 주흔작 수치 테이블 [0~70레벨 수치, 75~115레벨 수치, 120~250레벨 수치]
  // 적용 대상: 방어구 - 모자, 상의, 하의, 한벌옷, 신발, 망토, 어깨장식, 방패
  const armorUpgradeTable = {
    '100%': {
      stat: [1, 2, 3],
      hp: [55, 120, 180],
      allStat: [0, 0, 0],
      armor: [1, 2, 3],
    },
    '70%': {
      stat: [2, 3, 4],
      hp: [115, 190, 270],
      allStat: [0, 0, 0],
      armor: [2, 4, 5],
    },
    '30%': {
      stat: [3, 5, 7],
      hp: [180, 320, 470],
      allStat: [1, 2, 3],
      armor: [4, 7, 10],
    },
    '15%': {
      stat: [4, 7, 10],
      hp: [245, 460, 670],
      allStat: [2, 3, 4],
      armor: [6, 10, 15],
    },
  }
  // 장갑 주흔작 수치 테이블 [0~70레벨 수치, 75~250레벨 수치]
  const gloveUpgradeTable = {
    '100%': { atk: [0, 1] },
    '70%': { atk: [1, 2] },
    '30%': { atk: [2, 3] },
    '15%': { atk: [3, 4] },
  }
  // 무기 주흔작 수치 테이블 [0~70레벨 수치, 80~100레벨 수치, 120~250레벨 수치]
  // 적용 대상: 무기, 업그레이드 가능 횟수가 있는 보조무기
  const weaponUpgradeTable = {
    '100%': { atk: [1, 2, 3], stat: [0, 0, 2], hp: [0, 0, 50] },
    '70%': { atk: [2, 3, 5], stat: [0, 1, 2], hp: [0, 50, 100] },
    '30%': { atk: [3, 5, 7], stat: [1, 2, 3], hp: [50, 100, 150] },
    '15%': { atk: [5, 7, 9], stat: [2, 3, 4], hp: [100, 150, 200] },
  }
  // 장신구 주흔작 수치 테이블 [0~70레벨 수치, 75~115레벨 수치, 120~250레벨 수치]
  // 적용 대상: 반지, 펜던트, 벨트, 귀고리, 눈장식, 얼굴장식
  const accUpgradeTable = {
    '100%': { stat: [1, 1, 2], hp: [50, 50, 100], allStat: [0, 0, 0] },
    '70%': { stat: [2, 2, 3], hp: [100, 100, 150], allStat: [0, 0, 0] },
    '30%': { stat: [3, 4, 5], hp: [150, 200, 250], allStat: [1, 2, 3] },
  }

  // 방어구 주흔작 판별
  if (
    [
      '모자',
      '상의',
      '하의',
      '한벌옷',
      '신발',
      '망토',
      '어깨장식',
      '방패',
    ].includes(item.slot)
  ) {
    const level = item.baseOption?.baseEquipmentLevel ?? 0
    let levelIndex = 0
    if (level >= 75 && level <= 115) levelIndex = 1
    else if (level >= 120) levelIndex = 2

    const armor = (item.etcOption.armor ?? 0) / count

    // HP + 방어력 체크
    const hp = (item.etcOption.maxHp ?? 0) / count
    // Object.entries()로 주흔작 테이블 순회
    for (const [percent, values] of Object.entries(armorUpgradeTable)) {
      if (hp === values.hp[levelIndex] && armor === values.armor[levelIndex]) {
        return `${percent}작${upgradable ? '*' : ''}`
      }
    }

    // 주스탯 + 방어력 체크
    const mainStatValue =
      (item.etcOption[mainStat as keyof ItemOption] ?? 0) / count
    // Object.entries()로 주흔작 테이블 순회
    for (const [percent, values] of Object.entries(armorUpgradeTable)) {
      if (
        mainStatValue === values.stat[levelIndex] &&
        armor === values.armor[levelIndex]
      ) {
        return `${percent}작${upgradable ? '*' : ''}`
      }
    }
  }

  // 장갑 주흔작 판별
  if (item.slot === '장갑') {
    const level = item.baseOption?.baseEquipmentLevel ?? 0
    let levelIndex = 0
    if (level >= 75) levelIndex = 1

    const atk =
      atkStat.value === '공격력'
        ? (item.etcOption.attackPower ?? 0) / count
        : (item.etcOption.magicPower ?? 0) / count

    // 70제 100% 주흔작을 제외한 나머지 주흔작 체크
    for (const [percent, values] of Object.entries(gloveUpgradeTable)) {
      if (atk === values.atk[levelIndex]) {
        return `${percent}작${upgradable ? '*' : ''}`
      }
    }
  }

  // 무기 주흔작 판별
  if (['무기', '보조무기'].includes(item.slot)) {
    const level = item.baseOption?.baseEquipmentLevel ?? 0
    let levelIndex = 0
    if (level >= 80 && level <= 100) levelIndex = 1
    else if (level >= 120) levelIndex = 2

    const atk =
      atkStat.value === '공격력'
        ? (item.etcOption.attackPower ?? 0) / count
        : (item.etcOption.magicPower ?? 0) / count

    // 공격력만으로 주흔작 판별
    for (const [percent, values] of Object.entries(weaponUpgradeTable)) {
      if (atk === values.atk[levelIndex]) {
        return `${percent}작${upgradable ? '*' : ''}`
      }
    }
  }

  // 장신구 주흔작 판별
  if (
    ['반지', '펜던트', '벨트', '귀고리', '눈장식', '얼굴장식'].includes(
      item.slot,
    )
  ) {
    // 귀지작 체크
    if (item.slot === '귀고리') {
      const stats = item.etcOption
      if (
        count > 0 &&
        (stats.int ?? 0) / count === 3 &&
        (stats.magicPower ?? 0) / count === 5 &&
        (stats.str ?? 0) / count === 0 &&
        (stats.dex ?? 0) / count === 0 &&
        (stats.luk ?? 0) / count === 0 &&
        (stats.maxHp ?? 0) / count === 0 &&
        (stats.attackPower ?? 0) / count === 0
      ) {
        return `귀지작${upgradable ? '*' : ''}`
      }
    }

    const level = item.baseOption?.baseEquipmentLevel ?? 0
    let levelIndex = 0
    if (level >= 75 && level <= 115) levelIndex = 1
    else if (level >= 120) levelIndex = 2

    // 주스탯/HP 외의 다른 스탯이 있는지 체크
    const hasOtherStats = Object.entries(item.etcOption).some(
      ([key, value]) => {
        // 주스탯/HP가 아닌 다른 스탯이 0이 아니면 true
        if (mainStat === 'hp') {
          return key !== 'maxHp' && value !== 0 && value !== undefined
        } else {
          return key !== mainStat && value !== 0 && value !== undefined
        }
      },
    )

    // 다른 스탯이 없을 때만 주흔작 체크
    if (!hasOtherStats) {
      const statValue =
        mainStat === 'hp'
          ? (item.etcOption.maxHp ?? 0) / count
          : (item.etcOption[mainStat] ?? 0) / count

      for (const [percent, values] of Object.entries(accUpgradeTable)) {
        if (
          mainStat === 'hp'
            ? statValue === values.hp[levelIndex]
            : statValue === values.stat[levelIndex]
        ) {
          return `${percent}작${upgradable ? '*' : ''}`
        }
      }
    }
  }

  // 도미네이터 펜던트 파편작 판별
  if (item.name?.includes('도미네이터')) {
    const stats = item.etcOption
    if (
      count > 0 &&
      (stats.str ?? 0) / count === 3 &&
      (stats.dex ?? 0) / count === 3 &&
      (stats.int ?? 0) / count === 3 &&
      (stats.luk ?? 0) / count === 3 &&
      (stats.maxHp ?? 0) / count === 40 &&
      ((stats.attackPower ?? 0) / count === 3 ||
        (stats.magicPower ?? 0) / count === 3)
    ) {
      return `파편작${upgradable ? '*' : ''}`
    }
  }

  // 기존의 일반적인 경우 반환 (공마/스텟)
  return (
    Math.round(mainAtkUpgrade * 10) / 10 +
    '/' +
    Math.round(mainStatUpgrade * 10) / 10 +
    '작' +
    (upgradable ? '*' : '')
  )
}

const getPotentialColor = (grade: string) => {
  if (grade === 'EXCEPTIONAL') return 'bg-potential-exceptional'
  if (grade === 'LEGENDARY') return 'bg-potential-legendary'
  if (grade === 'UNIQUE') return 'bg-potential-unique'
  if (grade === 'EPIC') return 'bg-potential-epic'
  if (grade === 'RARE') return 'bg-potential-rare'
  if (grade === 'EXPIRED') return 'bg-potential-expired'
  return 'bg-potential-normal'
}

const getPotentialText = (item: ItemEquipmentInfo, pot: boolean) => {
  const potential = pot ? item.potentialOption : item.additionalPotentialOption
  if (!potential) return ''
  const parsed = parsePotentialList(potential)

  // 무보엠
  if (
    item.slot === '무기' ||
    item.slot === '보조무기' ||
    item.slot === '엠블렘'
  ) {
    const atkRate =
      atkStat.value === '공격력'
        ? parsed.attackPowerRate
        : parsed.magicPowerRate

    const text = []
    if (atkRate && !pot) text.push(atkStat.value.slice(0, 1) + atkRate)
    if (parsed.bossDamage) text.push('보' + parsed.bossDamage)
    if (parsed.ignoreMonsterArmor) text.push('방' + parsed.ignoreMonsterArmor)
    if (atkRate && pot) text.push(atkStat.value.slice(0, 1) + atkRate)

    if (mainStatName.value === 'HP' && parsed.maxHpRate)
      text.push('HP' + parsed.maxHpRate)
    if (
      (mainStatName.value === 'STR' || mainStatName.value === 'MIX') &&
      parsed.strRate
    )
      text.push('힘' + parsed.strRate)
    if (
      (mainStatName.value === 'DEX' || mainStatName.value === 'MIX') &&
      parsed.dexRate
    )
      text.push('덱' + parsed.dexRate)
    if (mainStatName.value === 'INT' && parsed.intRate)
      text.push('인' + parsed.intRate)
    if (
      (mainStatName.value === 'LUK' || mainStatName.value === 'MIX') &&
      parsed.lukRate
    )
      text.push('럭' + parsed.lukRate)
    if (parsed.allStatRate) text.push('올' + parsed.allStatRate)

    if (text.length === 0) return '-'
    return text.join('⋅')
  }

  // 일반템
  const text = []
  if (parsed.itemDropRate) text.push('드' + parsed.itemDropRate)
  if (parsed.mesosObtainedRate) text.push('메' + parsed.mesosObtainedRate)
  if (parsed.cooldownReduction) text.push('쿨' + parsed.cooldownReduction)
  if (parsed.criticalDamageRate) text.push('크' + parsed.criticalDamageRate)

  if (mainStatName.value === 'HP' && parsed.maxHpRate)
    text.push('HP' + parsed.maxHpRate)
  else if (mainStatName.value === 'MIX') {
    if (parsed.allStatRate) text.push('올' + parsed.allStatRate)
    if (parsed.strPerLevel) text.push('9렙힘' + parsed.strPerLevel)
    if (parsed.dexPerLevel) text.push('9렙덱' + parsed.dexPerLevel)
    if (parsed.lukPerLevel) text.push('9렙럭' + parsed.lukPerLevel)
    if (parsed.strRate) text.push('힘' + parsed.strRate)
    if (parsed.dexRate) text.push('덱' + parsed.dexRate)
    if (parsed.lukRate) text.push('럭' + parsed.lukRate)
  } else {
    const mainStatRateKey =
      (mainStatName.value.toLowerCase() as 'str' | 'dex' | 'int' | 'luk') +
      'Rate'
    const mainPerLevelKey =
      (mainStatName.value.toLowerCase() as 'str' | 'dex' | 'int' | 'luk') +
      'PerLevel'
    const mainStatRate =
      parsed[mainStatRateKey as 'strRate' | 'dexRate' | 'intRate' | 'lukRate']
    const mainPerLevel =
      parsed[
        mainPerLevelKey as
          'strPerLevel' | 'dexPerLevel' | 'intPerLevel' | 'lukPerLevel'
      ]

    if (mainPerLevel) text.push('9렙' + mainPerLevel)
    if (mainStatRate) text.push(mainStatRate + parsed.allStatRate + '%')
  }
  const atk =
    atkStat.value === '공격력' ? parsed.attackPower : parsed.magicPower
  if (atk) text.push(atkStat.value.slice(0, 1) + atk)

  if (text.length === 0) return '-'
  return (
    text.join('⋅') +
    (parsed.allStatRate &&
    mainStatName.value !== 'HP' &&
    mainStatName.value !== 'MIX'
      ? '⁺'
      : '')
  )
}

const getPotentialLine = (item: ItemEquipmentInfo) => {
  const contents = []

  if (item.potentialOptionGrade) {
    contents.push({
      color: item.potentialOptionGrade,
      text: getPotentialText(item, true),
    })
  }
  if (item.additionalPotentialOptionGrade) {
    contents.push({
      color: item.additionalPotentialOptionGrade,
      text: getPotentialText(item, false),
    })
  }
  if (item.exceptionalOption?.exceptionalUpgrade) {
    contents.push({
      color: 'EXCEPTIONAL',
      text: `+${item.exceptionalOption.exceptionalUpgrade}`,
    })
  }
  if (
    !item.potentialOptionGrade &&
    !item.additionalPotentialOptionGrade &&
    !item.exceptionalOption?.exceptionalUpgrade
  ) {
    if (item.specialRingLevel) {
      contents.push({
        color: 'NORMAL',
        text: `Lv. ${item.specialRingLevel}`,
      })
    } else if (item.dateOptionExpire) {
      const isExpired = new Date(item.dateOptionExpire) < new Date()

      // 초단위 제거
      contents.push({
        color: isExpired ? 'EXPIRED' : 'NORMAL',
        text: isExpired
          ? '옵션 기간 만료'
          : formatDateTime(item.dateOptionExpire) + ' 만료',
      })
    } else if (item.dateExpire) {
      contents.push({
        color: 'NORMAL',
        text: formatDateTime(item.dateExpire) + ' 까지',
      })
    } else {
      contents.push({
        color: 'NORMAL',
        text: '-',
      })
    }
  }

  return contents
}
</script>
