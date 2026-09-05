import { readFile } from 'node:fs/promises'

import {
  legacyEndpointRegistry,
  legacyQueryKeys,
  type LegacyEndpointId,
  type SafeQuery,
} from '@lara/nexon-client'

export const FIXTURE_SCHEMA_VERSION = 1 as const
export const NEXON_API_PATH_PREFIX = '/maplestory/v1' as const

export interface FixtureCharacter {
  nickname: string
  worldName?: string
  reason: string
}

export interface FixtureResponse {
  responseId: string
  endpointId: LegacyEndpointId
  path: string
  query: SafeQuery
  status: number
  contentType: string | null
  nexonErrorCode?: string
  retryAfter?: string
  bodyPath: string
  sha256: string
  latencyMs: number
  recordedAt: string
}

export interface FixtureCase {
  id: string
  character: FixtureCharacter
  responses: FixtureResponse[]
}

export interface FixtureManifest {
  schemaVersion: typeof FIXTURE_SCHEMA_VERSION
  source: 'recorded' | 'synthetic'
  recordedAt: string
  cases: FixtureCase[]
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const validateOnlyKeys = (
  value: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
  issues: string[],
): void => {
  const allowedSet = new Set(allowed)
  for (const key of Object.keys(value)) {
    if (!allowedSet.has(key)) {
      issues.push(`${path}.${key}는 허용되지 않습니다.`)
    }
  }
}

const requiredString = (
  value: unknown,
  path: string,
  issues: string[],
): string | null => {
  if (typeof value !== 'string' || value.length === 0) {
    issues.push(`${path}는 비어 있지 않은 문자열이어야 합니다.`)
    return null
  }
  return value
}

const optionalString = (
  value: unknown,
  path: string,
  issues: string[],
): string | undefined => {
  if (value === undefined) return undefined
  return requiredString(value, path, issues) ?? undefined
}

const isoDate = (
  value: unknown,
  path: string,
  issues: string[],
): string | null => {
  const result = requiredString(value, path, issues)
  if (result && Number.isNaN(Date.parse(result))) {
    issues.push(`${path}는 ISO 날짜여야 합니다.`)
  }
  return result
}

const nonNegativeNumber = (
  value: unknown,
  path: string,
  issues: string[],
): number | null => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    issues.push(`${path}는 0 이상의 숫자여야 합니다.`)
    return null
  }
  return value
}

const endpointIds = new Set<LegacyEndpointId>(
  Object.keys(legacyEndpointRegistry) as LegacyEndpointId[],
)
const queryKeys = new Set<string>(legacyQueryKeys)

const parseQuery = (
  value: unknown,
  path: string,
  issues: string[],
): SafeQuery | null => {
  if (!isObject(value)) {
    issues.push(`${path}는 객체여야 합니다.`)
    return null
  }
  validateOnlyKeys(value, legacyQueryKeys, path, issues)
  const query: Record<string, string> = {}
  for (const [key, queryValue] of Object.entries(value)) {
    if (!queryKeys.has(key)) {
      issues.push(`${path}.${key}는 허용되지 않은 query입니다.`)
      continue
    }
    if (typeof queryValue !== 'string') {
      issues.push(`${path}.${key}는 문자열이어야 합니다.`)
      continue
    }
    query[key] = queryValue
  }
  return query
}

const validateEndpointQuery = (
  endpointId: LegacyEndpointId,
  query: SafeQuery,
  path: string,
  issues: string[],
): void => {
  const keys = Object.keys(query)
  const allowed =
    endpointId === 'characterOcid'
      ? new Set(['character_name'])
      : endpointId === 'characterSkill'
        ? new Set(['ocid', 'date', 'character_skill_grade'])
        : endpointId === 'unionRanking'
          ? new Set(['date', 'world_name', 'ocid', 'page'])
          : new Set(['ocid', 'date'])
  for (const key of keys) {
    if (!allowed.has(key)) {
      issues.push(`${path}.${key}는 ${endpointId}에서 허용되지 않습니다.`)
    }
  }
  const required =
    endpointId === 'characterOcid'
      ? ['character_name']
      : endpointId === 'characterSkill'
        ? ['ocid', 'character_skill_grade']
        : endpointId === 'unionRanking'
          ? []
          : ['ocid']
  for (const key of required) {
    if (!query[key]) issues.push(`${path}.${key}가 필요합니다.`)
  }
}

const parseResponse = (
  value: unknown,
  path: string,
  issues: string[],
): FixtureResponse | null => {
  if (!isObject(value)) {
    issues.push(`${path}는 객체여야 합니다.`)
    return null
  }
  validateOnlyKeys(
    value,
    [
      'responseId',
      'endpointId',
      'path',
      'query',
      'status',
      'contentType',
      'nexonErrorCode',
      'retryAfter',
      'bodyPath',
      'sha256',
      'latencyMs',
      'recordedAt',
    ],
    path,
    issues,
  )
  const responseId = requiredString(
    value.responseId,
    `${path}.responseId`,
    issues,
  )
  const endpointValue = requiredString(
    value.endpointId,
    `${path}.endpointId`,
    issues,
  )
  if (!endpointValue || !endpointIds.has(endpointValue as LegacyEndpointId)) {
    issues.push(`${path}.endpointId가 registry에 없습니다.`)
    return null
  }
  const endpointId = endpointValue as LegacyEndpointId
  const expectedPath = `${NEXON_API_PATH_PREFIX}${legacyEndpointRegistry[endpointId].path}`
  if (value.path !== expectedPath) {
    issues.push(`${path}.path가 registry 경로와 다릅니다.`)
  }
  const query = parseQuery(value.query, `${path}.query`, issues)
  if (query) {
    validateEndpointQuery(endpointId, query, `${path}.query`, issues)
  }
  if (
    typeof value.status !== 'number' ||
    !Number.isInteger(value.status) ||
    value.status < 100 ||
    value.status > 599
  ) {
    issues.push(`${path}.status는 유효한 HTTP status여야 합니다.`)
  }
  const contentType =
    value.contentType === null
      ? null
      : requiredString(value.contentType, `${path}.contentType`, issues)
  const nexonErrorCode = optionalString(
    value.nexonErrorCode,
    `${path}.nexonErrorCode`,
    issues,
  )
  const retryAfter = optionalString(
    value.retryAfter,
    `${path}.retryAfter`,
    issues,
  )
  const bodyPath = requiredString(value.bodyPath, `${path}.bodyPath`, issues)
  const sha256 = requiredString(value.sha256, `${path}.sha256`, issues)
  const latencyMs = nonNegativeNumber(
    value.latencyMs,
    `${path}.latencyMs`,
    issues,
  )
  const recordedAt = isoDate(value.recordedAt, `${path}.recordedAt`, issues)

  if (bodyPath) {
    const segments = bodyPath.split('/')
    if (
      !bodyPath.startsWith('recordings/') ||
      bodyPath.startsWith('/') ||
      bodyPath.includes('\\') ||
      segments.some((segment) => segment === '..' || segment.length === 0)
    ) {
      issues.push(`${path}.bodyPath는 recordings 내부 상대 경로여야 합니다.`)
    }
  }
  if (sha256 && !/^[a-f0-9]{64}$/.test(sha256)) {
    issues.push(`${path}.sha256 형식이 잘못됐습니다.`)
  }

  if (
    !responseId ||
    !query ||
    typeof value.status !== 'number' ||
    !bodyPath ||
    !sha256 ||
    latencyMs === null ||
    !recordedAt
  ) {
    return null
  }

  const response: FixtureResponse = {
    responseId,
    endpointId,
    path: expectedPath,
    query,
    status: value.status,
    contentType,
    bodyPath,
    sha256,
    latencyMs,
    recordedAt,
  }
  if (nexonErrorCode !== undefined) response.nexonErrorCode = nexonErrorCode
  if (retryAfter !== undefined) response.retryAfter = retryAfter
  return response
}

export class FixtureManifestError extends Error {
  readonly issues: string[]

  constructor(issues: string[]) {
    super(`fixture manifest 검증 실패:\n${issues.join('\n')}`)
    this.name = 'FixtureManifestError'
    this.issues = issues
  }
}

export const parseFixtureManifest = (value: unknown): FixtureManifest => {
  if (!isObject(value)) {
    throw new FixtureManifestError(['manifest는 객체여야 합니다.'])
  }

  const issues: string[] = []
  validateOnlyKeys(
    value,
    ['schemaVersion', 'source', 'recordedAt', 'cases'],
    'manifest',
    issues,
  )
  if (value.schemaVersion !== FIXTURE_SCHEMA_VERSION) {
    issues.push(`schemaVersion은 ${FIXTURE_SCHEMA_VERSION}이어야 합니다.`)
  }
  const source = value.source
  if (source !== 'recorded' && source !== 'synthetic') {
    issues.push('source는 recorded 또는 synthetic이어야 합니다.')
  }
  const recordedAt = isoDate(value.recordedAt, 'recordedAt', issues)
  if (!Array.isArray(value.cases) || value.cases.length === 0) {
    issues.push('cases는 하나 이상의 항목을 가져야 합니다.')
  }

  const cases: FixtureCase[] = []
  const caseIds = new Set<string>()
  if (Array.isArray(value.cases)) {
    value.cases.forEach((caseValue, caseIndex) => {
      const casePath = `cases[${caseIndex}]`
      if (!isObject(caseValue)) {
        issues.push(`${casePath}는 객체여야 합니다.`)
        return
      }
      validateOnlyKeys(
        caseValue,
        ['id', 'character', 'responses'],
        casePath,
        issues,
      )
      const id = requiredString(caseValue.id, `${casePath}.id`, issues)
      if (id && !/^[a-z0-9][a-z0-9-]*$/.test(id)) {
        issues.push(`${casePath}.id 형식이 잘못됐습니다.`)
      }
      if (id && caseIds.has(id)) issues.push(`${casePath}.id가 중복됐습니다.`)
      if (id) caseIds.add(id)

      let character: FixtureCharacter | null = null
      if (!isObject(caseValue.character)) {
        issues.push(`${casePath}.character는 객체여야 합니다.`)
      } else {
        validateOnlyKeys(
          caseValue.character,
          ['nickname', 'worldName', 'reason'],
          `${casePath}.character`,
          issues,
        )
        const nickname = requiredString(
          caseValue.character.nickname,
          `${casePath}.character.nickname`,
          issues,
        )
        const reason = requiredString(
          caseValue.character.reason,
          `${casePath}.character.reason`,
          issues,
        )
        const worldName = optionalString(
          caseValue.character.worldName,
          `${casePath}.character.worldName`,
          issues,
        )
        if (nickname && reason) {
          character = { nickname, reason }
          if (worldName !== undefined) character.worldName = worldName
        }
      }

      if (
        !Array.isArray(caseValue.responses) ||
        caseValue.responses.length === 0
      ) {
        issues.push(`${casePath}.responses는 하나 이상이어야 합니다.`)
      }
      const responses: FixtureResponse[] = []
      const responseIds = new Set<string>()
      if (Array.isArray(caseValue.responses)) {
        caseValue.responses.forEach((responseValue, responseIndex) => {
          const response = parseResponse(
            responseValue,
            `${casePath}.responses[${responseIndex}]`,
            issues,
          )
          if (!response) return
          if (responseIds.has(response.responseId)) {
            issues.push(
              `${casePath}.responses[${responseIndex}].responseId가 중복됐습니다.`,
            )
          }
          responseIds.add(response.responseId)
          responses.push(response)
        })
      }
      if (id && character) cases.push({ id, character, responses })
    })
  }

  if (issues.length > 0 || !recordedAt) {
    throw new FixtureManifestError(issues)
  }
  return {
    schemaVersion: FIXTURE_SCHEMA_VERSION,
    source: source as 'recorded' | 'synthetic',
    recordedAt,
    cases,
  }
}

export const loadFixtureManifest = async (
  manifestPath: string,
): Promise<FixtureManifest> => {
  const source = await readFile(manifestPath, 'utf8')
  let value: unknown
  try {
    value = JSON.parse(source)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    throw new FixtureManifestError([`manifest JSON 오류: ${message}`])
  }
  return parseFixtureManifest(value)
}
