export interface HyperStatOption {
  statType: string
  statPoint: number
  statLevel: number
  statIncrease: string
}

export interface HyperStatPreset {
  hyperStatInfo: HyperStatOption[]
  presetNo: number
  active: boolean
  remainPoint: number
}

export interface HyperStat {
  hyperStatPreset: HyperStatPreset[]
}
