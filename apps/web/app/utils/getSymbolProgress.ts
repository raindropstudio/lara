import type { Symbol } from '~/types/symbol.type'

type SymbolProgress = {
  accCount: number
  totalRequire: number // 전체 누적
  progressPercent: number // 진행률 (%)
}

export const getArcaneProgress = (symbol: Symbol): SymbolProgress => {
  // 레벨당 필요치: n^2 + 11
  const levelRequire = [
    0, 12, 27, 47, 74, 110, 157, 217, 292, 384, 495, 627, 782, 962, 1169, 1405,
    1672, 1972, 2307, 2679,
  ]
  const totalRequire = 2679
  const accCount = (levelRequire[symbol.level - 1] ?? 0) + symbol.growthCount

  return {
    accCount,
    totalRequire,
    progressPercent: (accCount / totalRequire) * 100,
  }
}

export const getAuthenticProgress = (symbol: Symbol): SymbolProgress => {
  // 레벨당 필요치 9n^2 + 20n
  const levelRequire = [0, 29, 105, 246, 470, 795, 1239, 1820, 2556, 3456, 4565]
  const totalRequire = 4565
  const accCount = (levelRequire[symbol.level - 1] ?? 0) + symbol.growthCount

  return {
    accCount,
    totalRequire,
    progressPercent: (accCount / totalRequire) * 100,
  }
}
