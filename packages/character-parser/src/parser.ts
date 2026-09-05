import { parseAbility } from './ability.js'
import {
  parseBasic,
  parseHyperStat,
  parseJsonRecord,
  parseOcid,
  parsePopularity,
  parsePropensity,
  parseStat,
  parseUnion,
  type ParseMetadata,
} from './basic.js'
import {
  parseHexaMatrix,
  parseHexaStat,
  parseLinkSkill,
  parsePetEquipment,
  parseSetEffect,
  parseSkill,
  parseSymbol,
  parseVMatrix,
} from './collections.js'
import { parseCashEquipment, parseItemEquipment } from './equipment.js'
import type { ParseResult } from './result.js'

export type CharacterEndpointId =
  | 'characterOcid'
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
  | 'characterSkill'
  | 'characterLinkSkill'
  | 'characterVMatrix'
  | 'characterHexaMatrix'
  | 'characterHexaMatrixStat'
  | 'userUnion'
  | 'unionRanking'

export type EndpointParser = (
  body: Uint8Array | string,
  metadata?: ParseMetadata,
) => ParseResult<unknown>

export const characterParserRegistry = {
  characterOcid: parseOcid,
  characterBasic: parseBasic,
  characterPopularity: parsePopularity,
  characterStat: parseStat,
  characterHyperStat: parseHyperStat,
  characterPropensity: parsePropensity,
  characterAbility: parseAbility,
  characterItemEquipment: parseItemEquipment,
  characterCashItemEquipment: parseCashEquipment,
  characterSymbolEquipment: parseSymbol,
  characterSetEffect: parseSetEffect,
  characterBeautyEquipment: parseJsonRecord,
  characterAndroidEquipment: parseJsonRecord,
  characterPetEquipment: parsePetEquipment,
  characterSkill: (body, metadata) =>
    parseSkill(body, metadata?.skillGrade ?? 'unknown'),
  characterLinkSkill: parseLinkSkill,
  characterVMatrix: parseVMatrix,
  characterHexaMatrix: parseHexaMatrix,
  characterHexaMatrixStat: parseHexaStat,
  userUnion: parseUnion,
  unionRanking: parseJsonRecord,
} satisfies Record<CharacterEndpointId, EndpointParser>

export const parseCharacterEndpoint = (
  endpointId: CharacterEndpointId,
  body: Uint8Array | string,
  metadata?: ParseMetadata,
) => characterParserRegistry[endpointId](body, metadata)
