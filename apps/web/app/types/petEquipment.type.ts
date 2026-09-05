// 펫 장비 정보
export interface PetEquipmentInfo {
  itemName: string
  itemIcon?: string
  itemDescription?: string
  scrollUpgrade?: number
  scrollUpgradable?: number
  itemShape?: string
  itemShapeIcon?: string
  attackPower?: number
  magicPower?: number
}

// 펫 자동 스킬
export interface PetAutoSkill {
  skill1: string
  skill1Icon?: string
  skill2?: string
  skill2Icon?: string
}

// 펫 개별 정보
export interface PetInfo {
  petName: string
  petNickname: string
  petIcon?: string
  petDescription: string
  petEquipment?: PetEquipmentInfo
  petAutoSkill?: PetAutoSkill
  petType?: string
  petSkills: string[]
  petDateExpire?: string
  petAppearance?: string
  petAppearanceIcon?: string
}

// 전체 펫 정보
export interface PetEquipment {
  petNo: number
  petInfo: PetInfo
}
