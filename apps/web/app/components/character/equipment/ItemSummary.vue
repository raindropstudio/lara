<template>
  <div>
    <div class="grid grid-cols-3 items-center justify-center gap-6">
      <template v-for="(value, idx) in itemSummary" :key="idx">
        <div class="flex flex-col items-center justify-center">
          <div class="text-xl font-light text-lucidgray-dark">
            {{ value.name }}
          </div>
          <div class="text-3xl font-medium text-lucidviolet-700">
            {{ value.value }}
          </div>
        </div>
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

const itemSummary = computed(() => {
  const summary: {
    [key: string]: {
      name: string
      value: string
    }
  } = {
    starforce: { name: '스타포스', value: '-' },
    potential: { name: '잠재능력', value: '-' },
    additional: { name: '에디셔널', value: '-' },
    boss: { name: '무기류 보공', value: '-' },
    atkp: { name: '무기류 공/마%', value: '-' },
    ignoreDef: { name: '무기류 방무', value: '-' },
  }

  if (!viewPreset.value) return summary

  // 스타포스
  const starforce = viewPreset.value.reduce(
    (acc, equip) => {
      if (!equip || equip.starforce === undefined) return acc
      if (equip.starforceScrollFlag) return acc // 놀장템 제외
      if (
        equip.slot === '무기' ||
        equip.slot === '보조무기' ||
        equip.slot === '엠블렘'
      )
        return acc // 무기류 제외
      if (equip.slot === '기계 심장') return acc // 하트 제외
      if (equip.name.startsWith('헬리시움 정예 ')) return acc // 슈페리얼 제외
      if (equip.name.startsWith('노바 ')) return acc // 슈페리얼 제외
      if (equip.name.startsWith('타일런트 ')) return acc // 슈페리얼 제외
      return {
        sum: acc.sum + equip.starforce,
        count: acc.count + 1,
      }
    },
    { sum: 0, count: 0 },
  )
  summary.starforce = {
    name: '스타포스',
    value: (starforce.sum / (starforce.count || 1)).toFixed(1),
  }

  // 잠재, 에디
  const statPer = viewPreset.value.reduce(
    (acc, equip) => {
      if (!equip) return acc
      if (
        equip.slot === '무기' ||
        equip.slot === '보조무기' ||
        equip.slot === '엠블렘'
      )
        return acc // 무기류 제외
      if (!equip.potentialOptionGrade && !equip.additionalPotentialOptionGrade)
        return acc // 잠재 없으면

      // 잠재
      const potential = equip.potentialOption
      const additional = equip.additionalPotentialOption

      // 모자, 장갑은 에디만 계산
      // 잠재: <주스탯> : +N% / 올스탯 : +N%
      if (equip.slot !== '모자' && equip.slot !== '장갑') {
        acc.potentialCount += 1
        const parsed = parsePotentialList(potential ?? [])
        if (mainStatName.value === 'HP') {
          acc.potential += parsed.maxHpRate
        } else if (mainStatName.value === 'MIX') {
          acc.potential += parsed.allStatRate
          acc.potential += parsed.strRate * 0.33
          acc.potential += parsed.dexRate * 0.33
          acc.potential += parsed.lukRate * 0.33
        } else {
          acc.potential += parsed.allStatRate * 1.1
          const mainStatKey = mainStatName.value.toLowerCase() + 'Rate'
          acc.potential +=
            parsed[mainStatKey as 'strRate' | 'dexRate' | 'intRate' | 'lukRate']
        }
      }

      // 에디: <주스탯> : +N% / 올스탯 : +N% / <공/마> : +N / 캐릭터 기준 9레벨 당 <주스탯> : +N / <주스탯> : +N
      acc.additionalCount += 1
      const addiParsed = parsePotentialList(additional ?? [])
      if (mainStatName.value === 'HP') {
        acc.additional += addiParsed.maxHpRate
        acc.additional += addiParsed.attackPower * 0.4
      } else if (mainStatName.value === 'MIX') {
        acc.additional += addiParsed.allStatRate
        acc.additional += addiParsed.strRate * 0.33
        acc.additional += addiParsed.dexRate * 0.33
        acc.additional += addiParsed.lukRate * 0.33
        acc.additional += addiParsed.attackPower * 0.32
        acc.additional += addiParsed.strPerLevel * 1.5
        acc.additional += addiParsed.dexPerLevel * 1.5
        acc.additional += addiParsed.lukPerLevel * 1.5
      } else {
        acc.additional += addiParsed.allStatRate * 1.1
        const mainStatKey = mainStatName.value.toLowerCase() + 'Rate'
        acc.additional +=
          addiParsed[
            mainStatKey as 'strRate' | 'dexRate' | 'intRate' | 'lukRate'
          ]
        if (atkStat.value === '공격력')
          acc.additional += addiParsed.attackPower * 0.32
        else acc.additional += addiParsed.magicPower * 0.32
        const mainLevelKey = mainStatName.value.toLowerCase() + 'PerLevel'
        const mainLevelRate =
          addiParsed[
            mainLevelKey as
              'strPerLevel' | 'dexPerLevel' | 'intPerLevel' | 'lukPerLevel'
          ]
        acc.additional += mainLevelRate * 3.4
      }

      return acc
    },
    {
      potential: 0,
      additional: 0,
      potentialCount: 0,
      additionalCount: 0,
    },
  )

  // 보공, 공/마%, 방무
  const boss = viewPreset.value.reduce(
    (acc, equip) => {
      if (!equip) return acc
      if (
        equip.slot !== '무기' &&
        equip.slot !== '보조무기' &&
        equip.slot !== '엠블렘'
      )
        return acc // 무기류만

      const potential = equip.potentialOption
      const additional = equip.additionalPotentialOption

      acc.boss += (potential ?? []).reduce(
        (sum, pot) => sum + parsePotentialNumber(pot, '보스 몬스터', '%'),
        0,
      )
      acc.boss += (additional ?? []).reduce(
        (sum, add) => sum + parsePotentialNumber(add, '보스 몬스터', '%'),
        0,
      )

      acc.atkp += (potential ?? []).reduce(
        (sum, pot) => sum + parsePotentialNumber(pot, atkStat.value, '%'),
        0,
      )
      acc.atkp += (additional ?? []).reduce(
        (sum, add) => sum + parsePotentialNumber(add, atkStat.value, '%'),
        0,
      )

      const potDef = (potential ?? []).reduce(
        (acc, pot) =>
          (acc * (100 - parsePotentialNumber(pot, '몬스터 방어율', '%'))) / 100,
        1,
      )
      const addDef = (additional ?? []).reduce(
        (acc, add) =>
          (acc * (100 - parsePotentialNumber(add, '몬스터 방어율', '%'))) / 100,
        1,
      )
      acc.ignoreDef *= potDef * addDef

      return acc
    },
    {
      boss: 0,
      atkp: 0,
      ignoreDef: 1,
    },
  )

  summary.potential = {
    name: '잠재 ' + mainStatName.value,
    value: (statPer.potential / (statPer.potentialCount || 1)).toFixed(1) + '%',
  }
  summary.additional = {
    name: '에디 ' + mainStatName.value,
    value:
      (statPer.additional / (statPer.additionalCount || 1)).toFixed(1) + '%',
  }
  summary.boss = { name: '무기류 보공', value: boss.boss + '%' }
  summary.atkp = { name: '무기류 ' + atkStat.value, value: boss.atkp + '%' }
  summary.ignoreDef = {
    name: '무기류 방무',
    value: ((1 - boss.ignoreDef) * 100).toFixed(0) + '%',
  }

  return summary
})
</script>
