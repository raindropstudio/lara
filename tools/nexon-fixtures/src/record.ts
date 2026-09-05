import { constants } from 'node:fs'
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises'
import { basename, dirname, join, resolve } from 'node:path'

import {
  isCharacterDateEndpointId,
  type NexonClient,
  type NexonTransportResult,
} from '@lara/nexon-client'

import {
  FIXTURE_SCHEMA_VERSION,
  NEXON_API_PATH_PREFIX,
  type FixtureCase,
  type FixtureManifest,
  type FixtureResponse,
} from './manifest.js'
import type { FixturePlan, FixturePlanRequest } from './plan.js'
import { sha256, verifyFixtureManifest } from './verify.js'

export interface RecordFixtureOptions {
  concurrency?: number
  knownSecrets?: readonly string[]
}

export interface RecordFixtureResult {
  outputDirectory: string
  manifestPath: string
  responseCount: number
}

const mapLimit = async <Input, Output>(
  values: readonly Input[],
  concurrency: number,
  work: (value: Input, index: number) => Promise<Output>,
): Promise<Output[]> => {
  const results = new Array<Output>(values.length)
  let nextIndex = 0
  const worker = async (): Promise<void> => {
    while (nextIndex < values.length) {
      const index = nextIndex
      nextIndex += 1
      const value = values[index]
      if (value !== undefined) results[index] = await work(value, index)
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, values.length) }, worker),
  )
  return results
}

const requestEndpoint = (
  client: NexonClient,
  request: FixturePlanRequest,
  ocid: string,
): Promise<NexonTransportResult> => {
  if (request.endpointId === 'characterSkill') {
    return client.request('characterSkill', {
      ocid,
      ...request.params,
    })
  }
  if (request.endpointId === 'unionRanking') {
    return client.request('unionRanking', {
      ocid,
      ...request.params,
    })
  }
  if (isCharacterDateEndpointId(request.endpointId)) {
    return client.request(request.endpointId, {
      ocid,
      ...request.params,
    })
  }
  throw new TypeError(`지원하지 않는 endpoint입니다: ${request.endpointId}`)
}

const requireResponse = (
  result: NexonTransportResult,
  label: string,
): Extract<NexonTransportResult, { kind: 'response' }> => {
  if (result.kind === 'response') return result
  if (result.kind === 'timeout') {
    throw new Error(`${label}: ${result.timeoutMs}ms timeout`)
  }
  throw new Error(`${label}: ${result.code ?? 'TRANSPORT'} ${result.message}`)
}

const extractOcid = (
  result: Extract<NexonTransportResult, { kind: 'response' }>,
): string => {
  if (!result.ok) {
    throw new Error(`/id 요청이 HTTP ${result.status}로 실패했습니다.`)
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(new TextDecoder().decode(result.body))
  } catch {
    throw new Error('/id 응답이 유효한 JSON이 아닙니다.')
  }
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('/id 응답이 객체가 아닙니다.')
  }
  const ocid = Reflect.get(parsed, 'ocid')
  if (typeof ocid !== 'string' || ocid.length === 0) {
    throw new Error('/id 응답에 ocid가 없습니다.')
  }
  return ocid
}

const storeResponse = async (
  stagingDirectory: string,
  caseId: string,
  responseId: string,
  result: Extract<NexonTransportResult, { kind: 'response' }>,
): Promise<FixtureResponse> => {
  const hash = sha256(result.body)
  const bodyPath = `recordings/${caseId}/${hash}.body`
  const bodyFile = resolve(stagingDirectory, bodyPath)
  await mkdir(dirname(bodyFile), { recursive: true })
  try {
    await writeFile(bodyFile, result.body, { flag: 'wx' })
  } catch (error: unknown) {
    const code =
      typeof error === 'object' && error !== null
        ? Reflect.get(error, 'code')
        : undefined
    if (code !== 'EEXIST') throw error
    const existing = await readFile(bodyFile)
    if (sha256(existing) !== hash) {
      throw new Error(`${bodyPath}의 기존 내용이 hash와 다릅니다.`, {
        cause: error,
      })
    }
  }

  const response: FixtureResponse = {
    responseId,
    endpointId: result.request.endpoint,
    path: `${NEXON_API_PATH_PREFIX}${result.request.path}`,
    query: result.request.query,
    status: result.status,
    contentType: result.contentType,
    bodyPath,
    sha256: hash,
    latencyMs: result.latencyMs,
    recordedAt: new Date().toISOString(),
  }
  if (result.nexonErrorCode !== null) {
    response.nexonErrorCode = result.nexonErrorCode
  }
  if (result.retryAfter !== null) response.retryAfter = result.retryAfter
  return response
}

const outputMustNotExist = async (outputDirectory: string): Promise<void> => {
  try {
    await access(outputDirectory, constants.F_OK)
  } catch (error: unknown) {
    const code =
      typeof error === 'object' && error !== null
        ? Reflect.get(error, 'code')
        : undefined
    if (code === 'ENOENT') return
    throw error
  }
  throw new Error(`출력 경로가 이미 존재합니다: ${outputDirectory}`)
}

export const recordFixturePlan = async (
  plan: FixturePlan,
  outputPath: string,
  client: NexonClient,
  options: RecordFixtureOptions = {},
): Promise<RecordFixtureResult> => {
  const concurrency = options.concurrency ?? plan.concurrency ?? 1
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 8) {
    throw new TypeError('concurrency는 1부터 8 사이 정수여야 합니다.')
  }
  const outputDirectory = resolve(outputPath)
  if (outputDirectory === resolve('/')) {
    throw new Error('filesystem root를 출력 경로로 사용할 수 없습니다.')
  }
  await outputMustNotExist(outputDirectory)
  await mkdir(dirname(outputDirectory), { recursive: true })
  const stagingDirectory = await mkdtemp(
    join(dirname(outputDirectory), `.${basename(outputDirectory)}-`),
  )

  try {
    const fixtureCases: FixtureCase[] = []
    for (const fixtureCase of plan.cases) {
      const character: FixtureCase['character'] = {
        nickname: fixtureCase.nickname,
        reason: fixtureCase.reason,
      }
      if (fixtureCase.worldName !== undefined) {
        character.worldName = fixtureCase.worldName
      }
      const idResult = requireResponse(
        await client.request('characterOcid', {
          characterName: fixtureCase.nickname,
        }),
        `${fixtureCase.id}/character-ocid`,
      )
      const idResponse = await storeResponse(
        stagingDirectory,
        fixtureCase.id,
        'character-ocid',
        idResult,
      )
      // ID 조회 실패도 재생 가능한 응답으로 보존하고 다음 캐릭터를 기록한다.
      if (!idResult.ok) {
        fixtureCases.push({
          id: fixtureCase.id,
          character,
          responses: [idResponse],
        })
        continue
      }
      const ocid = extractOcid(idResult)

      const responses = await mapLimit(
        fixtureCase.requests,
        concurrency,
        async (request) => {
          const result = requireResponse(
            await requestEndpoint(client, request, ocid),
            `${fixtureCase.id}/${request.responseId}`,
          )
          return storeResponse(
            stagingDirectory,
            fixtureCase.id,
            request.responseId,
            result,
          )
        },
      )
      fixtureCases.push({
        id: fixtureCase.id,
        character,
        responses: [idResponse, ...responses],
      })
    }

    const manifest: FixtureManifest = {
      schemaVersion: FIXTURE_SCHEMA_VERSION,
      source: 'recorded',
      recordedAt: new Date().toISOString(),
      cases: fixtureCases,
    }
    const stagingManifest = resolve(stagingDirectory, 'manifest.json')
    await writeFile(stagingManifest, `${JSON.stringify(manifest, null, 2)}\n`, {
      flag: 'wx',
    })
    const verification = await verifyFixtureManifest(
      stagingManifest,
      options.knownSecrets,
    )
    if (!verification.valid) {
      throw new Error(verification.issues.join('\n'))
    }
    await rename(stagingDirectory, outputDirectory)
    return {
      outputDirectory,
      manifestPath: resolve(outputDirectory, 'manifest.json'),
      responseCount: fixtureCases.reduce(
        (count, fixtureCase) => count + fixtureCase.responses.length,
        0,
      ),
    }
  } catch (error: unknown) {
    await rm(stagingDirectory, { recursive: true, force: true })
    throw error
  }
}
