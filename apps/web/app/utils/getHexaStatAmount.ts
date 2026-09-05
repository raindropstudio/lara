type HexaStatInfo = {
  criticalDamage: number
  bossDamage: number
  ignoreMonsterArmor: number
  damage: number
  attackPower: number
  mainStat: number
}

const statNameMapper = (statName: string) => {
  if (statName.includes('크리티컬')) return 'criticalDamage'
  if (statName.includes('보스')) return 'bossDamage'
  if (statName.includes('무시')) return 'ignoreMonsterArmor'
  if (statName.includes('데미지')) return 'damage'
  if (statName.includes('공격력') || statName.includes('마력'))
    return 'attackPower'
  if (statName.includes('주력')) return 'mainStat'

  return null
}

const MAIN_STAT_TABLE: Record<number, HexaStatInfo> = {
  1: {
    criticalDamage: 0.35,
    bossDamage: 1,
    ignoreMonsterArmor: 1,
    damage: 0.75,
    attackPower: 5,
    mainStat: 100,
  },
  2: {
    criticalDamage: 0.7,
    bossDamage: 2,
    ignoreMonsterArmor: 2,
    damage: 1.5,
    attackPower: 10,
    mainStat: 200,
  },
  3: {
    criticalDamage: 1.05,
    bossDamage: 3,
    ignoreMonsterArmor: 3,
    damage: 2.25,
    attackPower: 15,
    mainStat: 300,
  },
  4: {
    criticalDamage: 1.4,
    bossDamage: 4,
    ignoreMonsterArmor: 4,
    damage: 3,
    attackPower: 20,
    mainStat: 400,
  },
  5: {
    criticalDamage: 2.1,
    bossDamage: 6,
    ignoreMonsterArmor: 6,
    damage: 4.5,
    attackPower: 30,
    mainStat: 600,
  },
  6: {
    criticalDamage: 2.8,
    bossDamage: 8,
    ignoreMonsterArmor: 8,
    damage: 6,
    attackPower: 40,
    mainStat: 800,
  },
  7: {
    criticalDamage: 3.5,
    bossDamage: 10,
    ignoreMonsterArmor: 10,
    damage: 7.5,
    attackPower: 50,
    mainStat: 1000,
  },
  8: {
    criticalDamage: 4.55,
    bossDamage: 13,
    ignoreMonsterArmor: 13,
    damage: 9.75,
    attackPower: 65,
    mainStat: 1300,
  },
  9: {
    criticalDamage: 5.6,
    bossDamage: 16,
    ignoreMonsterArmor: 16,
    damage: 12,
    attackPower: 80,
    mainStat: 1600,
  },
  10: {
    criticalDamage: 7,
    bossDamage: 20,
    ignoreMonsterArmor: 20,
    damage: 15,
    attackPower: 100,
    mainStat: 2000,
  },
} as const

const SUB_STAT_TABLE: Record<number, HexaStatInfo> = {
  1: {
    criticalDamage: 0.35,
    bossDamage: 1,
    ignoreMonsterArmor: 1,
    damage: 0.75,
    attackPower: 5,
    mainStat: 100,
  },
  2: {
    criticalDamage: 0.7,
    bossDamage: 2,
    ignoreMonsterArmor: 2,
    damage: 1.5,
    attackPower: 10,
    mainStat: 200,
  },
  3: {
    criticalDamage: 1.05,
    bossDamage: 3,
    ignoreMonsterArmor: 3,
    damage: 2.25,
    attackPower: 15,
    mainStat: 300,
  },
  4: {
    criticalDamage: 1.4,
    bossDamage: 4,
    ignoreMonsterArmor: 4,
    damage: 3,
    attackPower: 20,
    mainStat: 400,
  },
  5: {
    criticalDamage: 1.75,
    bossDamage: 5,
    ignoreMonsterArmor: 5,
    damage: 3.75,
    attackPower: 25,
    mainStat: 500,
  },
  6: {
    criticalDamage: 2.1,
    bossDamage: 6,
    ignoreMonsterArmor: 6,
    damage: 4.5,
    attackPower: 30,
    mainStat: 600,
  },
  7: {
    criticalDamage: 2.45,
    bossDamage: 7,
    ignoreMonsterArmor: 7,
    damage: 5.25,
    attackPower: 35,
    mainStat: 700,
  },
  8: {
    criticalDamage: 2.8,
    bossDamage: 8,
    ignoreMonsterArmor: 8,
    damage: 6,
    attackPower: 40,
    mainStat: 800,
  },
  9: {
    criticalDamage: 3.15,
    bossDamage: 9,
    ignoreMonsterArmor: 9,
    damage: 6.75,
    attackPower: 45,
    mainStat: 900,
  },
  10: {
    criticalDamage: 3.5,
    bossDamage: 10,
    ignoreMonsterArmor: 10,
    damage: 7.5,
    attackPower: 50,
    mainStat: 1000,
  },
} as const

export const getHexaStatAmount = ({
  characterMainStat,
  hexaStatName,
  hexaStatLevel,
  isMainHexaStat,
}: {
  characterMainStat: MainStat | null
  hexaStatName: string
  hexaStatLevel: number
  isMainHexaStat: boolean
}) => {
  if (!characterMainStat) return '0'

  const statName = statNameMapper(hexaStatName)
  if (!statName) return '0'

  const table = isMainHexaStat ? MAIN_STAT_TABLE : SUB_STAT_TABLE
  const statInfo = table[hexaStatLevel]
  const statAmount = statInfo?.[statName] ?? 0

  // 제논과 데몬어벤저의 경우 주스텟 수치 조정
  if (characterMainStat === 'mix') {
    if (!statInfo) return '0'
    if (statName === 'mainStat') {
      return Math.floor(statInfo.mainStat * 0.48).toString()
    }

    if (
      statName === 'criticalDamage' ||
      statName === 'bossDamage' ||
      statName === 'ignoreMonsterArmor' ||
      statName === 'damage'
    ) {
      return statAmount.toFixed(2) + '%'
    }

    return statAmount.toString()
  }
  if (characterMainStat === 'hp') {
    if (!statInfo) return '0'
    if (statName === 'mainStat') {
      return Math.floor(statInfo.mainStat * 2.1).toString()
    }

    if (
      statName === 'criticalDamage' ||
      statName === 'bossDamage' ||
      statName === 'ignoreMonsterArmor' ||
      statName === 'damage'
    ) {
      return statAmount.toFixed(2) + '%'
    }

    return statAmount.toString()
  }

  if (
    characterMainStat === 'str' ||
    characterMainStat === 'dex' ||
    characterMainStat === 'int' ||
    characterMainStat === 'luk'
  ) {
    if (
      statName === 'criticalDamage' ||
      statName === 'bossDamage' ||
      statName === 'ignoreMonsterArmor' ||
      statName === 'damage'
    ) {
      return statAmount.toFixed(2) + '%'
    }
  }

  return statAmount.toString()
}
