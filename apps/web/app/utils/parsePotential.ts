export const parsePotentialNumber = (
  potential: string,
  start: string,
  end?: string,
  separator = '+',
) => {
  if (potential.startsWith(start) && (!end || potential.endsWith(end))) {
    // end로 끝나는 경우 (예: %)
    if (end)
      return parseFloat(potential.split(separator)[1]?.split(end)[0] ?? '0')
    // 숫자로 끝나는 경우
    if (!isNaN(+potential.trim().slice(-1)))
      return parseFloat(potential.split('+')[1] ?? '0')
  }
  return 0
}

export const parsePotential = (potential: string) => {
  return {
    bossDamage: parsePotentialNumber(potential, '보스 몬스터', '%'),
    ignoreMonsterArmor: parsePotentialNumber(potential, '몬스터 방어율', '%'),
    attackPowerRate: parsePotentialNumber(potential, '공격력', '%'),
    magicPowerRate: parsePotentialNumber(potential, '마력', '%'),

    cooldownReduction: parsePotentialNumber(
      potential,
      '모든 스킬의 재사용 대기시간',
      '초(10초 이하는 10%감소, 5초 미만으로 감소 불가)',
      '-',
    ),
    criticalDamageRate: parsePotentialNumber(potential, '크리티컬 데미지', '%'),
    maxHpRate: parsePotentialNumber(potential, '최대 HP', '%'),

    strRate: parsePotentialNumber(potential, 'STR', '%'),
    dexRate: parsePotentialNumber(potential, 'DEX', '%'),
    intRate: parsePotentialNumber(potential, 'INT', '%'),
    lukRate: parsePotentialNumber(potential, 'LUK', '%'),
    allStatRate: parsePotentialNumber(potential, '올스탯', '%'),

    strPerLevel: parsePotentialNumber(potential, '캐릭터 기준 9레벨 당 STR'),
    dexPerLevel: parsePotentialNumber(potential, '캐릭터 기준 9레벨 당 DEX'),
    intPerLevel: parsePotentialNumber(potential, '캐릭터 기준 9레벨 당 INT'),
    lukPerLevel: parsePotentialNumber(potential, '캐릭터 기준 9레벨 당 LUK'),
    attackPower: parsePotentialNumber(potential, '공격력'),
    magicPower: parsePotentialNumber(potential, '마력'),

    itemDropRate: parsePotentialNumber(potential, '아이템 드롭률', '%'),
    mesosObtainedRate: parsePotentialNumber(potential, '메소', '%'),
  }
}

export const parsePotentialList = (potentialList: string[]) => {
  const initialValue: ReturnType<typeof parsePotential> = Object.keys(
    parsePotential(''),
  ).reduce(
    (acc, key) => {
      acc[key as keyof ReturnType<typeof parsePotential>] = 0
      return acc
    },
    {} as ReturnType<typeof parsePotential>,
  )

  return potentialList.reduce((acc, potential) => {
    const parsed = parsePotential(potential)

    // 각 속성 값을 더해줌
    Object.keys(parsed).forEach((key) => {
      acc[key as keyof typeof parsed] =
        (acc[key as keyof typeof parsed] || 0) +
        parsed[key as keyof typeof parsed]
    })

    return acc
  }, initialValue)
}
