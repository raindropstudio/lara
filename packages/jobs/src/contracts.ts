export type CollectionQoS = 'interactive' | 'daily-top' | 'repair' | 'backfill'

export const qosPriority = {
  interactive: 1,
  'daily-top': 10,
  repair: 50,
  backfill: 100,
} as const satisfies Record<CollectionQoS, number>

export type ResolveCharacterJob = {
  kind: 'resolve-character'
  runId: string
  nickname: string
  qos: CollectionQoS
}

export type CharacterSectionId =
  | 'characterBasic'
  | 'characterPopularity'
  | 'characterStat'
  | 'characterHyperStat'
  | 'characterPropensity'
  | 'characterAbility'
  | 'characterItemEquipment'
  | 'characterCashItemEquipment'
  | 'characterSymbolEquipment'
  | 'characterSetEffect'
  | 'characterBeautyEquipment'
  | 'characterAndroidEquipment'
  | 'characterPetEquipment'
  | 'characterSkill5'
  | 'characterSkill6'
  | 'characterLinkSkill'
  | 'characterVMatrix'
  | 'characterHexaMatrix'
  | 'characterHexaMatrixStat'
  | 'userUnion'

export type FetchCharacterSectionJob = {
  kind: 'fetch-character-section'
  runId: string
  nickname: string
  ocid: string
  sectionId: CharacterSectionId
  qos: CollectionQoS
}

export type NexonFetchJob = ResolveCharacterJob | FetchCharacterSectionJob

export const NEXON_FETCH_QUEUE = 'lara-nexon-fetch'

export interface CollectionQueue {
  enqueueCollection(input: ResolveCharacterJob): Promise<void>
}

export interface NexonFetchQueue extends CollectionQueue {
  enqueueSections(input: readonly FetchCharacterSectionJob[]): Promise<void>
}
