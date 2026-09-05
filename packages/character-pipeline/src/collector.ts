import {
  parseCharacterEndpoint,
  parseOcid,
  type CharacterBasic,
  type ParseMetadata,
  type ParseResult,
} from '@lara/character-parser'
import type {
  DataStore,
  FetchObservation,
  RawFetchInput,
} from '@lara/data-store'
import type { NexonClient, NexonTransportResult } from '@lara/nexon-client'

import {
  basicCharacterTargets,
  fullCharacterTargets,
  type CharacterTarget,
} from './targets.js'

export type CollectionSectionResult = {
  sectionId: string
  status: 'complete' | 'partial' | 'failed' | 'unavailable'
  fetchId?: string
  parseRunId?: string
  issueCount: number
  upstreamStatus?: number
  nexonErrorCode?: string
  retryAfterMs?: number
}

export type CharacterCollectionReport = {
  nickname: string
  ocid?: string
  status: 'complete' | 'partial' | 'failed'
  sections: CollectionSectionResult[]
}

export type TargetCollectionResult = {
  target: CharacterTarget
  report: CollectionSectionResult
  basic?: CharacterBasic
}

export type CharacterCollectorOptions = {
  client: NexonClient
  store: DataStore
  now?: () => Date
}

export class CharacterCollector {
  private readonly now: () => Date

  constructor(private readonly options: CharacterCollectorOptions) {
    this.now = options.now ?? (() => new Date())
  }

  collectBasic(nickname: string) {
    return this.collect(nickname, basicCharacterTargets)
  }

  collectFull(nickname: string) {
    return this.collect(nickname, fullCharacterTargets)
  }

  async collect(
    nickname: string,
    targets: readonly CharacterTarget[],
  ): Promise<CharacterCollectionReport> {
    const identityResponse = await this.options.client.request(
      'characterOcid',
      {
        characterName: nickname,
      },
    )
    const identityFetch = await this.persistFetch(identityResponse)
    const identityParsed =
      identityResponse.kind === 'response' && identityResponse.ok
        ? parseOcid(identityResponse.body)
        : undefined

    if (!identityParsed?.value) {
      if (identityParsed)
        await this.options.store.saveParseRun({
          fetchId: identityFetch.id,
          endpointId: 'characterOcid',
          parserVersion: identityParsed.parserVersion,
          status: identityParsed.status,
          parsedAt: identityFetch.fetchedAt,
          issues: identityParsed.issues,
          unknownPaths: identityParsed.unknownPaths,
        })
      const identitySection: CollectionSectionResult = {
        sectionId: 'characterOcid',
        status:
          identityResponse.kind === 'response' && identityResponse.ok
            ? 'failed'
            : 'unavailable',
        fetchId: identityFetch.id,
        issueCount: identityParsed?.issues.length ?? 1,
      }
      if (identityResponse.kind === 'response') {
        identitySection.upstreamStatus = identityResponse.status
        if (identityResponse.nexonErrorCode !== null)
          identitySection.nexonErrorCode = identityResponse.nexonErrorCode
        const retryAfterMs = parseRetryAfter(
          identityResponse.retryAfter,
          this.now(),
        )
        if (retryAfterMs !== undefined)
          identitySection.retryAfterMs = retryAfterMs
      }
      return {
        nickname,
        status: 'failed',
        sections: [identitySection],
      }
    }

    const ocid = identityParsed.value.ocid
    await this.options.store.saveParseRun({
      fetchId: identityFetch.id,
      endpointId: 'characterOcid',
      parserVersion: identityParsed.parserVersion,
      status: identityParsed.status,
      parsedAt: identityFetch.fetchedAt,
      issues: identityParsed.issues,
      unknownPaths: identityParsed.unknownPaths,
      value: identityParsed.value,
    })
    await this.options.store.upsertCharacterIdentity({
      ocid,
      nickname,
      observedAt: identityFetch.fetchedAt,
    })

    const settled = await Promise.all(
      targets.map((target) => this.collectTarget(ocid, target)),
    )
    const successfulBasic = settled.find(
      (entry) => entry.target.sectionId === 'characterBasic',
    )?.basic
    if (successfulBasic) {
      await this.options.store.upsertCharacterIdentity({
        ocid,
        nickname: successfulBasic.nickname,
        observedAt: successfulBasic.updatedAt ?? this.now().toISOString(),
      })
    }

    const sections = settled.map(({ report }) => report)
    const failures = sections.filter(
      ({ status }) => status === 'failed' || status === 'unavailable',
    ).length
    return {
      nickname,
      ocid,
      status:
        failures === 0
          ? sections.some(({ status }) => status === 'partial')
            ? 'partial'
            : 'complete'
          : failures === sections.length
            ? 'failed'
            : 'partial',
      sections,
    }
  }

  async collectTarget(
    ocid: string,
    target: CharacterTarget,
  ): Promise<TargetCollectionResult> {
    let response: NexonTransportResult
    try {
      response =
        target.endpointId === 'characterSkill'
          ? await this.options.client.request('characterSkill', {
              ocid,
              skillGrade: target.skillGrade,
            })
          : await this.options.client.request(target.endpointId, { ocid })
    } catch {
      return {
        target,
        report: {
          sectionId: target.sectionId,
          status: 'unavailable' as const,
          issueCount: 1,
        },
      }
    }

    const fetch = await this.persistFetch(response)
    if (response.kind !== 'response' || !response.ok) {
      const issue = {
        path: '$',
        code:
          response.kind === 'timeout'
            ? 'upstream_timeout'
            : response.kind === 'transport-error'
              ? 'upstream_transport_error'
              : 'upstream_status',
        message:
          response.kind === 'response'
            ? `Nexon API가 ${response.status}를 반환했습니다.`
            : response.kind === 'timeout'
              ? 'Nexon API 요청 시간이 초과됐습니다.'
              : 'Nexon API에 연결할 수 없습니다.',
      }
      const parseRun = await this.options.store.saveParseRun({
        fetchId: fetch.id,
        endpointId: target.sectionId,
        parserVersion: 'transport-v1',
        status: 'failed',
        parsedAt: fetch.fetchedAt,
        issues: [issue],
        unknownPaths: [],
      })
      await this.options.store.updateCharacterSection({
        ocid,
        endpointId: target.sectionId,
        attempt: {
          fetchId: fetch.id,
          parseRunId: parseRun.id,
          status: 'unavailable',
          observedAt: fetch.fetchedAt,
          parserVersion: parseRun.parserVersion,
          issues: [issue],
        },
      })
      const report: CollectionSectionResult = {
        sectionId: target.sectionId,
        status: 'unavailable',
        fetchId: fetch.id,
        parseRunId: parseRun.id,
        issueCount: 1,
      }
      if (response.kind === 'response') {
        report.upstreamStatus = response.status
        if (response.nexonErrorCode !== null)
          report.nexonErrorCode = response.nexonErrorCode
        const retryAfterMs = parseRetryAfter(response.retryAfter, this.now())
        if (retryAfterMs !== undefined) report.retryAfterMs = retryAfterMs
      }
      return {
        target,
        report,
      }
    }

    const metadata: ParseMetadata = { ocid }
    if (target.endpointId === 'characterSkill')
      metadata.skillGrade = target.skillGrade
    const parsed = parseCharacterEndpoint(
      target.endpointId,
      response.body,
      metadata,
    )
    const parseRun = await this.persistParse(target.sectionId, fetch, parsed)
    const attemptStatus =
      parsed.status === 'failed' ? ('failed' as const) : parsed.status
    const update = {
      ocid,
      endpointId: target.sectionId,
      attempt: {
        fetchId: fetch.id,
        parseRunId: parseRun.id,
        status: attemptStatus,
        observedAt: fetch.fetchedAt,
        parserVersion: parseRun.parserVersion,
        issues: parsed.issues,
      },
    }
    if (parsed.value !== undefined && parseRun.valueHash) {
      await this.options.store.updateCharacterSection({
        ...update,
        value: parsed.value,
        valueHash: parseRun.valueHash,
      })
    } else {
      await this.options.store.updateCharacterSection(update)
    }
    const result: TargetCollectionResult = {
      target,
      report: {
        sectionId: target.sectionId,
        status: parsed.status,
        fetchId: fetch.id,
        parseRunId: parseRun.id,
        issueCount: parsed.issues.length,
      },
    }
    if (target.sectionId === 'characterBasic' && parsed.value)
      result.basic = parsed.value as CharacterBasic
    return result
  }

  private async persistParse(
    endpointId: string,
    fetch: FetchObservation,
    parsed: ParseResult<unknown>,
  ) {
    const input = {
      fetchId: fetch.id,
      endpointId,
      parserVersion: parsed.parserVersion,
      status: parsed.status,
      parsedAt: fetch.fetchedAt,
      issues: parsed.issues,
      unknownPaths: parsed.unknownPaths,
    }
    return parsed.value === undefined
      ? this.options.store.saveParseRun(input)
      : this.options.store.saveParseRun({ ...input, value: parsed.value })
  }

  private async persistFetch(result: NexonTransportResult) {
    const fetchedAt = this.now().toISOString()
    const input: RawFetchInput = {
      endpointId: result.request.endpoint,
      path: result.request.path,
      query: result.request.query,
      fetchedAt,
      latencyMs: result.latencyMs,
      outcome:
        result.kind === 'transport-error' ? 'transport_error' : result.kind,
    }
    if (result.kind === 'response') {
      input.status = result.status
      input.body = result.body
      if (result.contentType !== null) input.contentType = result.contentType
      if (result.retryAfter !== null) input.retryAfter = result.retryAfter
      if (result.nexonErrorCode !== null)
        input.nexonErrorCode = result.nexonErrorCode
    } else if (result.kind === 'transport-error' && result.code !== null) {
      input.errorCode = result.code
    }
    return this.options.store.saveFetch(input)
  }
}

const parseRetryAfter = (value: string | null, now: Date) => {
  if (value === null) return undefined
  const seconds = Number(value)
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1_000
  const date = Date.parse(value)
  if (!Number.isNaN(date)) return Math.max(0, date - now.getTime())
  return undefined
}
