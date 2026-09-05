import { describe, expect, it } from 'vitest'
import { activeEquipmentPreset, equipmentForPreset } from './equipment'

describe('장비 프리셋', () => {
  it('배열 순서와 무관하게 활성 프리셋과 칭호·특수 장비를 고른다', () => {
    const weapon = { name: '무기', part: '무기', slot: '무기' }
    const dragon = { name: '드래곤 장비', part: '장비', slot: '드래곤 모자' }
    const presets = [
      { presetNo: 5, active: false, itemEquipmentInfo: [dragon] },
      { presetNo: 2, active: true, itemEquipmentInfo: [weapon] },
      { presetNo: 1, active: false, itemEquipmentInfo: [] },
    ]
    expect(activeEquipmentPreset(presets)?.presetNo).toBe(2)
    expect(equipmentForPreset(presets)).toEqual([weapon, dragon])
    expect(equipmentForPreset(presets, 1)).toEqual([dragon])
    expect(equipmentForPreset()).toEqual([])
  })
})
