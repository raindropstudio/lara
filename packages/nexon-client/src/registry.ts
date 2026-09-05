export type SkillGrade =
  | '0'
  | '1'
  | '1.5'
  | '2'
  | '2.5'
  | '3'
  | '4'
  | '5'
  | '6'
  | 'hyperpassive'
  | 'hyperactive'

export type SafeQuery = Readonly<Record<string, string>>

export interface CharacterNameQuery {
  characterName: string
}

export interface CharacterDateQuery {
  ocid: string
  date?: string
}

export interface CharacterSkillQuery extends CharacterDateQuery {
  skillGrade: SkillGrade
}

export interface UnionRankingQuery {
  date?: string
  worldName?: string
  ocid?: string
  page?: number | string
}

export interface LegacyEndpointQueries {
  characterOcid: CharacterNameQuery
  characterBasic: CharacterDateQuery
  characterPopularity: CharacterDateQuery
  characterStat: CharacterDateQuery
  characterHyperStat: CharacterDateQuery
  characterPropensity: CharacterDateQuery
  characterAbility: CharacterDateQuery
  characterItemEquipment: CharacterDateQuery
  characterCashItemEquipment: CharacterDateQuery
  characterSymbolEquipment: CharacterDateQuery
  characterSetEffect: CharacterDateQuery
  characterBeautyEquipment: CharacterDateQuery
  characterAndroidEquipment: CharacterDateQuery
  characterPetEquipment: CharacterDateQuery
  characterSkill: CharacterSkillQuery
  characterLinkSkill: CharacterDateQuery
  characterVMatrix: CharacterDateQuery
  characterHexaMatrix: CharacterDateQuery
  characterHexaMatrixStat: CharacterDateQuery
  userUnion: CharacterDateQuery
  unionRanking: UnionRankingQuery
}

export type LegacyEndpointId = keyof LegacyEndpointQueries

export type LegacyEndpointScope = 'nickname' | 'character' | 'ranking'

export interface LegacyEndpointDefinition<Input> {
  path: `/${string}`
  scope: LegacyEndpointScope
  buildQuery: (input: Input) => SafeQuery
}

type LegacyEndpointRegistry = {
  [Endpoint in LegacyEndpointId]: LegacyEndpointDefinition<
    LegacyEndpointQueries[Endpoint]
  >
}

const requiredText = (value: string, name: string): string => {
  const normalized = value.trim()
  if (normalized.length === 0) {
    throw new TypeError(`${name} 값이 비어 있습니다.`)
  }
  return normalized
}

const buildSafeQuery = (
  entries: ReadonlyArray<readonly [string, string | number | undefined]>,
): SafeQuery => {
  const query: Record<string, string> = {}
  for (const [key, value] of entries) {
    if (value !== undefined) {
      query[key] = String(value)
    }
  }
  return Object.freeze(query)
}

const buildCharacterDateQuery = (input: CharacterDateQuery): SafeQuery =>
  buildSafeQuery([
    ['ocid', requiredText(input.ocid, 'ocid')],
    ['date', input.date],
  ])

const characterDateEndpoint = (
  path: `/${string}`,
): LegacyEndpointDefinition<CharacterDateQuery> => ({
  path,
  scope: 'character',
  buildQuery: buildCharacterDateQuery,
})

export const legacyEndpointRegistry = {
  characterOcid: {
    path: '/id',
    scope: 'nickname',
    buildQuery: (input: CharacterNameQuery) =>
      buildSafeQuery([
        ['character_name', requiredText(input.characterName, 'characterName')],
      ]),
  },
  characterBasic: characterDateEndpoint('/character/basic'),
  characterPopularity: characterDateEndpoint('/character/popularity'),
  characterStat: characterDateEndpoint('/character/stat'),
  characterHyperStat: characterDateEndpoint('/character/hyper-stat'),
  characterPropensity: characterDateEndpoint('/character/propensity'),
  characterAbility: characterDateEndpoint('/character/ability'),
  characterItemEquipment: characterDateEndpoint('/character/item-equipment'),
  characterCashItemEquipment: characterDateEndpoint(
    '/character/cashitem-equipment',
  ),
  characterSymbolEquipment: characterDateEndpoint(
    '/character/symbol-equipment',
  ),
  characterSetEffect: characterDateEndpoint('/character/set-effect'),
  characterBeautyEquipment: characterDateEndpoint(
    '/character/beauty-equipment',
  ),
  characterAndroidEquipment: characterDateEndpoint(
    '/character/android-equipment',
  ),
  characterPetEquipment: characterDateEndpoint('/character/pet-equipment'),
  characterSkill: {
    path: '/character/skill',
    scope: 'character',
    buildQuery: (input: CharacterSkillQuery) =>
      buildSafeQuery([
        ['ocid', requiredText(input.ocid, 'ocid')],
        ['date', input.date],
        ['character_skill_grade', input.skillGrade],
      ]),
  },
  characterLinkSkill: characterDateEndpoint('/character/link-skill'),
  characterVMatrix: characterDateEndpoint('/character/vmatrix'),
  characterHexaMatrix: characterDateEndpoint('/character/hexamatrix'),
  characterHexaMatrixStat: characterDateEndpoint('/character/hexamatrix-stat'),
  userUnion: characterDateEndpoint('/user/union'),
  unionRanking: {
    path: '/ranking/union',
    scope: 'ranking',
    buildQuery: (input: UnionRankingQuery) =>
      buildSafeQuery([
        ['date', input.date],
        ['world_name', input.worldName],
        ['ocid', input.ocid],
        ['page', input.page],
      ]),
  },
} satisfies LegacyEndpointRegistry

export const characterDateEndpointIds = [
  'characterBasic',
  'characterPopularity',
  'characterStat',
  'characterHyperStat',
  'characterPropensity',
  'characterAbility',
  'characterItemEquipment',
  'characterCashItemEquipment',
  'characterSymbolEquipment',
  'characterSetEffect',
  'characterBeautyEquipment',
  'characterAndroidEquipment',
  'characterPetEquipment',
  'characterLinkSkill',
  'characterVMatrix',
  'characterHexaMatrix',
  'characterHexaMatrixStat',
  'userUnion',
] as const satisfies ReadonlyArray<LegacyEndpointId>

export type CharacterDateEndpointId = (typeof characterDateEndpointIds)[number]

const characterDateEndpointSet = new Set<LegacyEndpointId>(
  characterDateEndpointIds,
)

export const isCharacterDateEndpointId = (
  value: LegacyEndpointId,
): value is CharacterDateEndpointId => characterDateEndpointSet.has(value)

export const legacyQueryKeys = [
  'character_name',
  'ocid',
  'date',
  'character_skill_grade',
  'world_name',
  'page',
] as const
