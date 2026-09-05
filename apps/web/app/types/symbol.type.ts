export interface Symbol {
  name: string // 심볼 이름
  force: number // 포스
  level: number // 레벨
  str: number // STR
  dex: number // DEX
  int: number // INT
  luk: number // LUK
  hp: number // HP
  dropRate: number // 아이템 드롭률
  mesoRate: number // 메소 획득량
  expRate: number // 경험치 획득량
  growthCount: number // 현재 성장치
  requireGrowthCount: number // 필요 성장치
}
