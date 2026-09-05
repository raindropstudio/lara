<template>
  <div class="flex flex-col gap-4">
    <!-- 전투력 & 스탯 공격력 (메인 스탯) -->
    <CharacterStatCard>
      <div class="grid grid-cols-2 gap-x-4">
        <div class="flex flex-col items-stretch justify-between">
          <span class="text-base font-medium text-lucidgray-dark">전투력</span>
          <span class="text-right text-xl font-bold text-lucidviolet-700">
            {{ character.stat.combatPower?.toLocaleString() }}
          </span>
        </div>
        <div class="flex flex-col items-stretch">
          <span class="text-base font-medium text-lucidgray-dark"
            >스탯 공격력</span
          >
          <div class="flex flex-col items-stretch">
            <span class="-mb-3 text-base font-bold text-lucidgray-medium">
              {{ character.stat.minStatAttackPower?.toLocaleString() }} ~
            </span>
            <span class="self-end text-xl font-bold text-lucidviolet-700">
              {{ character.stat.maxStatAttackPower?.toLocaleString() }}
            </span>
          </div>
        </div>
      </div>
    </CharacterStatCard>

    <!-- 기본 스탯 -->
    <CharacterStatCard>
      <div class="grid grid-cols-2 gap-x-4">
        <div
          v-for="stat in basicStats"
          :key="stat.key"
          class="flex items-center justify-between gap-8"
        >
          <span class="w-8 text-lucidgray-dark">{{ stat.label }}</span>

          <UiTooltip>
            <span class="ml-5 text-lucidviolet-700">
              <!-- 투자 스탯이 4 이상일 경우 볼드처리 -->
              <span
                v-if="
                  character.stat[stat.ap] && Number(character.stat[stat.ap]) > 4
                "
                class="font-bold"
              >
                {{ character.stat[stat.key]?.toLocaleString() }}
              </span>
              <span v-else>
                {{ character.stat[stat.key]?.toLocaleString() }}
              </span>
            </span>
            <template #tooltip>
              <div class="text-lucidviolet-700">
                {{ getTooltipContent(stat.key) }}
              </div>
            </template>
          </UiTooltip>
        </div>
      </div>
    </CharacterStatCard>

    <!-- 상세 스탯 -->
    <div class="flex flex-col gap-2">
      <CharacterStatCard v-for="(section, index) in detailStats" :key="index">
        <div class="grid grid-cols-2 gap-x-4">
          <div
            v-for="(stat, idx) in section"
            :key="idx"
            class="flex items-center justify-between"
          >
            <span class="text-sm text-lucidgray-dark">{{ stat.label }}</span>
            <span class="ml-5 text-base font-medium text-lucidviolet-700">{{
              stat.value
            }}</span>
          </div>
        </div>
      </CharacterStatCard>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  character: Character
}>()

// 기본 스탯 데이터
const basicStats = [
  { key: 'hp' as keyof Stat, label: 'HP', ap: 'apHp' as keyof Stat },
  { key: 'mp' as keyof Stat, label: 'MP', ap: 'apMp' as keyof Stat },
  { key: 'str' as keyof Stat, label: 'STR', ap: 'apStr' as keyof Stat },
  { key: 'dex' as keyof Stat, label: 'DEX', ap: 'apDex' as keyof Stat },
  { key: 'int' as keyof Stat, label: 'INT', ap: 'apInt' as keyof Stat },
  { key: 'luk' as keyof Stat, label: 'LUK', ap: 'apLuk' as keyof Stat },
]

// 상세 스탯 데이터
const detailStats = computed(() => [
  // 스탯 1
  [
    {
      label: '방어율 무시',
      value: `${props.character.stat.ignoreDefenseRate ?? 0}%`,
    },
    {
      label: '최종 데미지',
      value: `${props.character.stat.finalDamage ?? 0}%`,
    },
    { label: '공격력', value: props.character.stat.attackPower ?? 0 },
    { label: '데미지', value: `${props.character.stat.damage ?? 0}%` },
    { label: '마력', value: props.character.stat.magicPower ?? 0 },
    {
      label: '보스 데미지',
      value: `${props.character.stat.bossMonsterDamage ?? 0}%`,
    },
    {
      label: '재사용 대기시간 감소',
      value: `${props.character.stat.cooldownReductionPercent ?? 0}%`,
    },
    {
      label: '크리티컬 확률',
      value: `${props.character.stat.criticalRate ?? 0}%`,
    },
    {
      label: '재사용 대기시간 미적용',
      value: `${props.character.stat.cooldownExemption ?? 0}%`,
    },
    {
      label: '크리티컬 데미지',
      value: `${props.character.stat.criticalDamage ?? 0}%`,
    },
    {
      label: '상태이상 추가 데미지',
      value: `${props.character.stat.abnormalStatusAdditionalDamage ?? 0}%`,
    },
    {
      label: '버프 지속시간',
      value: `${props.character.stat.buffDuration ?? 0}%`,
    },
    {
      label: '속성 내성 무시',
      value: `${props.character.stat.ignoreAttributeResistance ?? 0}%`,
    },
    {
      label: '무기 숙련도',
      value: `${props.character.stat.weaponMastery ?? 0}%`,
    },
  ],
  // 스탯 2
  [
    {
      label: '메소 획득량',
      value: `${props.character.stat.mesoAcquisition ?? 0}%`,
    },
    { label: '스타포스', value: props.character.stat.starForce ?? 0 },
    {
      label: '아이템 드롭률',
      value: `${props.character.stat.itemDropRate ?? 0}%`,
    },
    { label: '아케인포스', value: props.character.stat.arcaneForce ?? 0 },
    {
      label: '추가 경험치 획득',
      value: `${props.character.stat.additionalExp ?? 0}%`,
    },
    { label: '어센틱포스', value: props.character.stat.authenticForce ?? 0 },
  ],
  // 스탯 3
  [
    { label: '방어력', value: props.character.stat.defense ?? 0 },
    {
      label: '상태이상 내성',
      value: `${props.character.stat.abnormalStatusResistance ?? 0}%`,
    },
    { label: '이동속도', value: props.character.stat.moveSpeed ?? 0 },
    { label: '점프력', value: props.character.stat.jumpPower ?? 0 },
    { label: '스탠스', value: props.character.stat.stance ?? 0 },
    { label: '공격 속도', value: props.character.stat.attackSpeed ?? 0 },
  ],
])

const getTooltipContent = (key: keyof Stat) => {
  const tooltipContents: Record<keyof Stat, string> = {
    hp: `(${props.character.stat.apHp?.toLocaleString() ?? 0} + ${((props.character.stat.hp ?? 0) - (props.character.stat.apHp ?? 0)).toLocaleString()})`,
    mp: `(${props.character.stat.apMp?.toLocaleString() ?? 0} + ${((props.character.stat.mp ?? 0) - (props.character.stat.apMp ?? 0)).toLocaleString()})`,
    str: `(${props.character.stat.apStr?.toLocaleString() ?? 0} + ${((props.character.stat.str ?? 0) - (props.character.stat.apStr ?? 0)).toLocaleString()})`,
    dex: `(${props.character.stat.apDex?.toLocaleString() ?? 0} + ${((props.character.stat.dex ?? 0) - (props.character.stat.apDex ?? 0)).toLocaleString()})`,
    int: `(${props.character.stat.apInt?.toLocaleString() ?? 0} + ${((props.character.stat.int ?? 0) - (props.character.stat.apInt ?? 0)).toLocaleString()})`,
    luk: `(${props.character.stat.apLuk?.toLocaleString() ?? 0} + ${((props.character.stat.luk ?? 0) - (props.character.stat.apLuk ?? 0)).toLocaleString()})`,
  } as Record<keyof Stat, string>

  return tooltipContents[key] || '정보 없음'
}
</script>
