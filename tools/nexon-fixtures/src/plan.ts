import { readFile } from 'node:fs/promises'

import {
  isCharacterDateEndpointId,
  legacyEndpointRegistry,
  type CharacterDateEndpointId,
  type LegacyEndpointId,
  type SkillGrade,
} from '@lara/nexon-client'

export interface CharacterDatePlanRequest {
  responseId: string
  endpointId: CharacterDateEndpointId
  params?: { date?: string }
}

export interface CharacterSkillPlanRequest {
  responseId: string
  endpointId: 'characterSkill'
  params: { date?: string; skillGrade: SkillGrade }
}

export interface UnionRankingPlanRequest {
  responseId: string
  endpointId: 'unionRanking'
  params?: { date?: string; worldName?: string; page?: number }
}

export type FixturePlanRequest =
  CharacterDatePlanRequest | CharacterSkillPlanRequest | UnionRankingPlanRequest

export interface FixturePlanCase {
  id: string
  nickname: string
  worldName?: string
  reason: string
  requests: FixturePlanRequest[]
}

export interface FixturePlan {
  schemaVersion: 1
  concurrency?: number
  cases: FixturePlanCase[]
}

const skillGrades = new Set<SkillGrade>([
  '0',
  '1',
  '1.5',
  '2',
  '2.5',
  '3',
  '4',
  '5',
  '6',
  'hyperpassive',
  'hyperactive',
])

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const assertOnlyKeys = (
  value: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
): void => {
  const allowedSet = new Set(allowed)
  for (const key of Object.keys(value)) {
    if (!allowedSet.has(key)) {
      throw new TypeError(`${path}.${key}는 허용되지 않습니다.`)
    }
  }
}

const requiredString = (value: unknown, path: string): string => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new TypeError(`${path}는 비어 있지 않은 문자열이어야 합니다.`)
  }
  return value.trim()
}

const optionalString = (value: unknown, path: string): string | undefined => {
  if (value === undefined) return undefined
  return requiredString(value, path)
}

const parseParams = (
  value: unknown,
  endpointId: Exclude<LegacyEndpointId, 'characterOcid'>,
  path: string,
): FixturePlanRequest['params'] => {
  const params = value === undefined ? {} : value
  if (!isObject(params)) throw new TypeError(`${path}는 객체여야 합니다.`)

  if (endpointId === 'characterSkill') {
    assertOnlyKeys(params, ['date', 'skillGrade'], path)
    const skillGrade = requiredString(params.skillGrade, `${path}.skillGrade`)
    if (!skillGrades.has(skillGrade as SkillGrade)) {
      throw new TypeError(`${path}.skillGrade가 지원되지 않습니다.`)
    }
    const result: { date?: string; skillGrade: SkillGrade } = {
      skillGrade: skillGrade as SkillGrade,
    }
    const date = optionalString(params.date, `${path}.date`)
    if (date !== undefined) result.date = date
    return result
  }

  if (endpointId === 'unionRanking') {
    assertOnlyKeys(params, ['date', 'worldName', 'page'], path)
    const result: { date?: string; worldName?: string; page?: number } = {}
    const date = optionalString(params.date, `${path}.date`)
    const worldName = optionalString(params.worldName, `${path}.worldName`)
    if (date !== undefined) result.date = date
    if (worldName !== undefined) result.worldName = worldName
    if (params.page !== undefined) {
      if (
        typeof params.page !== 'number' ||
        !Number.isInteger(params.page) ||
        params.page < 1
      ) {
        throw new TypeError(`${path}.page는 양의 정수여야 합니다.`)
      }
      result.page = params.page
    }
    return result
  }

  assertOnlyKeys(params, ['date'], path)
  const result: { date?: string } = {}
  const date = optionalString(params.date, `${path}.date`)
  if (date !== undefined) result.date = date
  return result
}

const parseRequest = (value: unknown, path: string): FixturePlanRequest => {
  if (!isObject(value)) throw new TypeError(`${path}는 객체여야 합니다.`)
  assertOnlyKeys(value, ['responseId', 'endpointId', 'params'], path)
  const responseId = requiredString(value.responseId, `${path}.responseId`)
  const endpointValue = requiredString(value.endpointId, `${path}.endpointId`)
  if (!(endpointValue in legacyEndpointRegistry)) {
    throw new TypeError(`${path}.endpointId가 registry에 없습니다.`)
  }
  const endpointId = endpointValue as LegacyEndpointId
  if (endpointId === 'characterOcid') {
    throw new TypeError(`${path}.endpointId의 /id 호출은 자동으로 기록됩니다.`)
  }
  const params = parseParams(value.params, endpointId, `${path}.params`)

  if (endpointId === 'characterSkill') {
    return {
      responseId,
      endpointId,
      params: params as CharacterSkillPlanRequest['params'],
    }
  }
  if (endpointId === 'unionRanking') {
    const request: UnionRankingPlanRequest = { responseId, endpointId }
    const rankingParams = params as UnionRankingPlanRequest['params']
    if (rankingParams && Object.keys(rankingParams).length > 0) {
      request.params = rankingParams
    }
    return request
  }
  if (!isCharacterDateEndpointId(endpointId)) {
    throw new TypeError(`${path}.endpointId scope를 지원하지 않습니다.`)
  }
  const request: CharacterDatePlanRequest = { responseId, endpointId }
  const characterParams = params as CharacterDatePlanRequest['params']
  if (characterParams && Object.keys(characterParams).length > 0) {
    request.params = characterParams
  }
  return request
}

export const parseFixturePlan = (value: unknown): FixturePlan => {
  if (!isObject(value)) throw new TypeError('plan은 객체여야 합니다.')
  assertOnlyKeys(value, ['schemaVersion', 'concurrency', 'cases'], 'plan')
  if (value.schemaVersion !== 1) {
    throw new TypeError('plan.schemaVersion은 1이어야 합니다.')
  }
  let concurrency: number | undefined
  if (value.concurrency !== undefined) {
    if (
      typeof value.concurrency !== 'number' ||
      !Number.isInteger(value.concurrency) ||
      value.concurrency < 1 ||
      value.concurrency > 8
    ) {
      throw new TypeError('plan.concurrency는 1부터 8 사이 정수여야 합니다.')
    }
    concurrency = value.concurrency
  }
  if (!Array.isArray(value.cases) || value.cases.length === 0) {
    throw new TypeError('plan.cases는 하나 이상이어야 합니다.')
  }

  const ids = new Set<string>()
  const cases = value.cases.map((caseValue, caseIndex): FixturePlanCase => {
    const path = `plan.cases[${caseIndex}]`
    if (!isObject(caseValue)) throw new TypeError(`${path}는 객체여야 합니다.`)
    assertOnlyKeys(
      caseValue,
      ['id', 'nickname', 'worldName', 'reason', 'requests'],
      path,
    )
    const id = requiredString(caseValue.id, `${path}.id`)
    if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) {
      throw new TypeError(`${path}.id 형식이 잘못됐습니다.`)
    }
    if (ids.has(id)) throw new TypeError(`${path}.id가 중복됐습니다.`)
    ids.add(id)
    const nickname = requiredString(caseValue.nickname, `${path}.nickname`)
    const reason = requiredString(caseValue.reason, `${path}.reason`)
    const worldName = optionalString(caseValue.worldName, `${path}.worldName`)
    if (!Array.isArray(caseValue.requests) || caseValue.requests.length === 0) {
      throw new TypeError(`${path}.requests는 하나 이상이어야 합니다.`)
    }
    const responseIds = new Set<string>(['character-ocid'])
    const requests = caseValue.requests.map((request, requestIndex) => {
      const parsed = parseRequest(request, `${path}.requests[${requestIndex}]`)
      if (responseIds.has(parsed.responseId)) {
        throw new TypeError(
          `${path}.requests[${requestIndex}].responseId가 중복됐습니다.`,
        )
      }
      responseIds.add(parsed.responseId)
      return parsed
    })
    const result: FixturePlanCase = { id, nickname, reason, requests }
    if (worldName !== undefined) result.worldName = worldName
    return result
  })

  const plan: FixturePlan = { schemaVersion: 1, cases }
  if (concurrency !== undefined) plan.concurrency = concurrency
  return plan
}

export const loadFixturePlan = async (path: string): Promise<FixturePlan> => {
  const source = await readFile(path, 'utf8')
  return parseFixturePlan(JSON.parse(source) as unknown)
}
