export interface CashEquipmentInfo {
  part: string
  slot: string
  name: string
  icon?: string
  description?: string
  dateExpire?: string
  dateOptionExpire?: string
  label?: string
  itemGender?: string
  option?: ItemOption
  coloringPrismRange?: string
  coloringPrismHue?: number
  coloringPrismSaturation?: number
  coloringPrismValue?: number
}

export interface CashEquipmentPreset {
  presetNo: number
  active: boolean
  cashEquipmentInfo: CashEquipmentInfo[]
}
