// 해당 레벨까지의 누적 사용치
const solTable = {
  '스킬 코어': [
    { level: 0, solErda: 0, solErdaPiece: 0 },
    { level: 1, solErda: 5, solErdaPiece: 100 },
    { level: 2, solErda: 6, solErdaPiece: 130 },
    { level: 3, solErda: 7, solErdaPiece: 165 },
    { level: 4, solErda: 8, solErdaPiece: 205 },
    { level: 5, solErda: 10, solErdaPiece: 250 },
    { level: 6, solErda: 12, solErdaPiece: 300 },
    { level: 7, solErda: 14, solErdaPiece: 355 },
    { level: 8, solErda: 17, solErdaPiece: 415 },
    { level: 9, solErda: 20, solErdaPiece: 480 },
    { level: 10, solErda: 30, solErdaPiece: 680 },
    { level: 11, solErda: 33, solErdaPiece: 760 },
    { level: 12, solErda: 36, solErdaPiece: 850 },
    { level: 13, solErda: 40, solErdaPiece: 950 },
    { level: 14, solErda: 44, solErdaPiece: 1060 },
    { level: 15, solErda: 48, solErdaPiece: 1180 },
    { level: 16, solErda: 52, solErdaPiece: 1310 },
    { level: 17, solErda: 56, solErdaPiece: 1450 },
    { level: 18, solErda: 60, solErdaPiece: 1600 },
    { level: 19, solErda: 65, solErdaPiece: 1760 },
    { level: 20, solErda: 80, solErdaPiece: 2110 },
    { level: 21, solErda: 85, solErdaPiece: 2280 },
    { level: 22, solErda: 90, solErdaPiece: 2460 },
    { level: 23, solErda: 95, solErdaPiece: 2650 },
    { level: 24, solErda: 100, solErdaPiece: 2850 },
    { level: 25, solErda: 105, solErdaPiece: 3060 },
    { level: 26, solErda: 111, solErdaPiece: 3280 },
    { level: 27, solErda: 117, solErdaPiece: 3510 },
    { level: 28, solErda: 123, solErdaPiece: 3750 },
    { level: 29, solErda: 130, solErdaPiece: 4000 },
    { level: 30, solErda: 150, solErdaPiece: 4500 },
  ],
  '마스터리 코어': [
    { level: 0, solErda: 0, solErdaPiece: 0 },
    { level: 1, solErda: 3, solErdaPiece: 50 },
    { level: 2, solErda: 4, solErdaPiece: 65 },
    { level: 3, solErda: 5, solErdaPiece: 83 },
    { level: 4, solErda: 6, solErdaPiece: 103 },
    { level: 5, solErda: 7, solErdaPiece: 126 },
    { level: 6, solErda: 8, solErdaPiece: 151 },
    { level: 7, solErda: 9, solErdaPiece: 179 },
    { level: 8, solErda: 11, solErdaPiece: 209 },
    { level: 9, solErda: 13, solErdaPiece: 242 },
    { level: 10, solErda: 18, solErdaPiece: 342 },
    { level: 11, solErda: 20, solErdaPiece: 382 },
    { level: 12, solErda: 22, solErdaPiece: 427 },
    { level: 13, solErda: 24, solErdaPiece: 477 },
    { level: 14, solErda: 26, solErdaPiece: 532 },
    { level: 15, solErda: 28, solErdaPiece: 592 },
    { level: 16, solErda: 30, solErdaPiece: 657 },
    { level: 17, solErda: 32, solErdaPiece: 727 },
    { level: 18, solErda: 34, solErdaPiece: 802 },
    { level: 19, solErda: 37, solErdaPiece: 882 },
    { level: 20, solErda: 45, solErdaPiece: 1057 },
    { level: 21, solErda: 48, solErdaPiece: 1142 },
    { level: 22, solErda: 51, solErdaPiece: 1232 },
    { level: 23, solErda: 54, solErdaPiece: 1327 },
    { level: 24, solErda: 57, solErdaPiece: 1427 },
    { level: 25, solErda: 60, solErdaPiece: 1532 },
    { level: 26, solErda: 63, solErdaPiece: 1642 },
    { level: 27, solErda: 66, solErdaPiece: 1757 },
    { level: 28, solErda: 69, solErdaPiece: 1877 },
    { level: 29, solErda: 73, solErdaPiece: 2002 },
    { level: 30, solErda: 83, solErdaPiece: 2252 },
  ],
  '강화 코어': [
    { level: 0, solErda: 0, solErdaPiece: 0 },
    { level: 1, solErda: 4, solErdaPiece: 75 },
    { level: 2, solErda: 5, solErdaPiece: 98 },
    { level: 3, solErda: 6, solErdaPiece: 125 },
    { level: 4, solErda: 7, solErdaPiece: 155 },
    { level: 5, solErda: 9, solErdaPiece: 189 },
    { level: 6, solErda: 11, solErdaPiece: 227 },
    { level: 7, solErda: 13, solErdaPiece: 269 },
    { level: 8, solErda: 16, solErdaPiece: 314 },
    { level: 9, solErda: 19, solErdaPiece: 363 },
    { level: 10, solErda: 27, solErdaPiece: 513 },
    { level: 11, solErda: 30, solErdaPiece: 573 },
    { level: 12, solErda: 33, solErdaPiece: 641 },
    { level: 13, solErda: 36, solErdaPiece: 716 },
    { level: 14, solErda: 39, solErdaPiece: 799 },
    { level: 15, solErda: 42, solErdaPiece: 889 },
    { level: 16, solErda: 45, solErdaPiece: 987 },
    { level: 17, solErda: 48, solErdaPiece: 1092 },
    { level: 18, solErda: 51, solErdaPiece: 1205 },
    { level: 19, solErda: 55, solErdaPiece: 1325 },
    { level: 20, solErda: 67, solErdaPiece: 1588 },
    { level: 21, solErda: 71, solErdaPiece: 1716 },
    { level: 22, solErda: 75, solErdaPiece: 1851 },
    { level: 23, solErda: 79, solErdaPiece: 1994 },
    { level: 24, solErda: 83, solErdaPiece: 2144 },
    { level: 25, solErda: 87, solErdaPiece: 2302 },
    { level: 26, solErda: 92, solErdaPiece: 2467 },
    { level: 27, solErda: 97, solErdaPiece: 2640 },
    { level: 28, solErda: 102, solErdaPiece: 2820 },
    { level: 29, solErda: 108, solErdaPiece: 3008 },
    { level: 30, solErda: 123, solErdaPiece: 3383 },
  ],
  '공용 코어': [
    { level: 0, solErda: 0, solErdaPiece: 0 },
    { level: 1, solErda: 7, solErdaPiece: 125 },
    { level: 2, solErda: 9, solErdaPiece: 163 },
    { level: 3, solErda: 11, solErdaPiece: 207 },
    { level: 4, solErda: 13, solErdaPiece: 257 },
    { level: 5, solErda: 16, solErdaPiece: 314 },
    { level: 6, solErda: 19, solErdaPiece: 377 },
    { level: 7, solErda: 22, solErdaPiece: 446 },
    { level: 8, solErda: 27, solErdaPiece: 521 },
    { level: 9, solErda: 32, solErdaPiece: 603 },
    { level: 10, solErda: 46, solErdaPiece: 903 },
    { level: 11, solErda: 51, solErdaPiece: 1013 },
    { level: 12, solErda: 56, solErdaPiece: 1137 },
    { level: 13, solErda: 62, solErdaPiece: 1275 },
    { level: 14, solErda: 68, solErdaPiece: 1427 },
    { level: 15, solErda: 74, solErdaPiece: 1592 },
    { level: 16, solErda: 80, solErdaPiece: 1771 },
    { level: 17, solErda: 86, solErdaPiece: 1964 },
    { level: 18, solErda: 92, solErdaPiece: 2171 },
    { level: 19, solErda: 99, solErdaPiece: 2391 },
    { level: 20, solErda: 116, solErdaPiece: 2916 },
    { level: 21, solErda: 123, solErdaPiece: 3150 },
    { level: 22, solErda: 130, solErdaPiece: 3398 },
    { level: 23, solErda: 137, solErdaPiece: 3660 },
    { level: 24, solErda: 144, solErdaPiece: 3935 },
    { level: 25, solErda: 151, solErdaPiece: 4224 },
    { level: 26, solErda: 160, solErdaPiece: 4527 },
    { level: 27, solErda: 169, solErdaPiece: 4844 },
    { level: 28, solErda: 178, solErdaPiece: 5174 },
    { level: 29, solErda: 188, solErdaPiece: 5518 },
    { level: 30, solErda: 208, solErdaPiece: 6268 },
  ],
} as const

export const getHexaProgress = (character: Character | undefined) => {
  // 각 코어별 30레벨 에르다 합
  const totalErda =
    solTable['공용 코어'][30].solErda * 1 +
    solTable['마스터리 코어'][30].solErda * 4 +
    solTable['강화 코어'][30].solErda * 4 +
    solTable['스킬 코어'][30].solErda * 1

  // 각 코어별 30레벨 에르다 조각 합
  const totalErdaPiece =
    solTable['공용 코어'][30].solErdaPiece * 1 +
    solTable['마스터리 코어'][30].solErdaPiece * 4 +
    solTable['강화 코어'][30].solErdaPiece * 4 +
    solTable['스킬 코어'][30].solErdaPiece * 1

  if (!character || !character.skillCore)
    return {
      totalErda,
      totalErdaPiece,
      currentErda: 0,
      currentErdaPiece: 0,
    }

  const cores = character.skillCore.filter((core) => core.skillCore.grade === 6)

  // 캐릭터의 현재 합
  const current = cores.reduce(
    (acc, core) => {
      if (!core.skillCore || core.skillCore.grade !== 6) return acc

      const coreType = core.skillCore.coreType as keyof typeof solTable
      const coreLevel = core.coreLevel

      if (!solTable[coreType]) return acc
      return {
        erda: acc.erda + (solTable[coreType][coreLevel]?.solErda ?? 0),
        erdaPiece:
          acc.erdaPiece + (solTable[coreType][coreLevel]?.solErdaPiece ?? 0),
      }
    },
    { erda: 0, erdaPiece: 0 },
  )

  return {
    totalErda,
    totalErdaPiece,
    currentErda: current.erda,
    currentErdaPiece: current.erdaPiece,
  }
}
