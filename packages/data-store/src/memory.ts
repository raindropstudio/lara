import { randomUUID } from 'node:crypto'

import { semanticHash, sha256 } from './hash.js'
import type {
  CharacterCurrent,
  CharacterSectionUpdate,
  CollectionRun,
  CollectionRunQoS,
  CollectionStepOutcome,
  DataStore,
  FetchObservation,
  ParseRun,
  ParseRunInput,
  RawFetchInput,
  StoredRawPayload,
} from './types.js'

export class MemoryDataStore implements DataStore {
  private readonly rawPayloads = new Map<string, StoredRawPayload>()
  private readonly fetches = new Map<string, FetchObservation>()
  private readonly parseRuns = new Map<string, ParseRun>()
  private readonly characters = new Map<string, CharacterCurrent>()
  private readonly collectionRuns = new Map<string, CollectionRun>()

  async ensureIndexes() {}

  async isReady() {
    return true
  }

  async saveFetch(input: RawFetchInput) {
    const id = randomUUID()
    const body = input.body
    const rawHash = body ? sha256(body) : undefined
    if (body && rawHash && !this.rawPayloads.has(rawHash)) {
      const payload: StoredRawPayload = {
        hash: rawHash,
        body: body.slice(),
        size: body.byteLength,
        firstSeenAt: input.fetchedAt,
      }
      if (input.contentType !== undefined)
        payload.contentType = input.contentType
      this.rawPayloads.set(rawHash, payload)
    }

    const observation: FetchObservation = {
      id,
      endpointId: input.endpointId,
      path: input.path,
      query: { ...input.query },
      fetchedAt: input.fetchedAt,
      latencyMs: input.latencyMs,
      outcome: input.outcome,
    }
    copyFetchOptionals(input, observation)
    if (rawHash) observation.rawHash = rawHash
    if (body) observation.bodySize = body.byteLength
    this.fetches.set(id, observation)
    return structuredClone(observation)
  }

  async getRawPayload(hash: string) {
    const payload = this.rawPayloads.get(hash)
    return payload ? structuredClone(payload) : null
  }

  async saveParseRun(input: ParseRunInput) {
    const existing = [...this.parseRuns.values()].find(
      (run) =>
        run.fetchId === input.fetchId &&
        run.parserVersion === input.parserVersion,
    )
    if (existing) return structuredClone(existing)

    const run: ParseRun = { id: randomUUID(), ...structuredClone(input) }
    if (input.value !== undefined)
      run.valueHash = semanticHash(
        input.endpointId,
        input.parserVersion,
        input.value,
      )
    this.parseRuns.set(run.id, run)
    return structuredClone(run)
  }

  async upsertCharacterIdentity(input: {
    ocid: string
    nickname: string
    observedAt: string
  }) {
    const existing = this.characters.get(input.ocid)
    if (existing) {
      if (existing.identityObservedAt > input.observedAt)
        return structuredClone(existing)
      if (existing.nickname !== input.nickname) {
        existing.aliases = [
          ...new Set(
            existing.aliases
              .filter((alias) => alias !== input.nickname)
              .concat(existing.nickname),
          ),
        ]
        existing.nickname = input.nickname
      }
      existing.identityObservedAt = input.observedAt
      existing.updatedAt =
        input.observedAt > existing.updatedAt
          ? input.observedAt
          : existing.updatedAt
      return structuredClone(existing)
    }
    const character: CharacterCurrent = {
      ocid: input.ocid,
      nickname: input.nickname,
      aliases: [],
      identityObservedAt: input.observedAt,
      updatedAt: input.observedAt,
      sections: {},
    }
    this.characters.set(input.ocid, character)
    return structuredClone(character)
  }

  async updateCharacterSection(update: CharacterSectionUpdate) {
    const character = this.characters.get(update.ocid)
    if (!character) throw new Error(`캐릭터가 없습니다: ${update.ocid}`)
    const current = character.sections[update.endpointId]?.currentAttempt
    if (current && current.observedAt > update.attempt.observedAt) return
    const section = { currentAttempt: structuredClone(update.attempt) }
    if (
      update.value !== undefined &&
      update.valueHash &&
      (update.attempt.status === 'complete' ||
        update.attempt.status === 'partial')
    ) {
      Object.assign(section, {
        lastKnownGood: {
          value: structuredClone(update.value),
          valueHash: update.valueHash,
          observedAt: update.attempt.observedAt,
          parserVersion: update.attempt.parserVersion,
          completeness: update.attempt.status,
        },
      })
    } else {
      const lastKnownGood = character.sections[update.endpointId]?.lastKnownGood
      if (lastKnownGood)
        Object.assign(section, {
          lastKnownGood: structuredClone(lastKnownGood),
        })
    }
    character.sections[update.endpointId] = section
    character.updatedAt =
      update.attempt.observedAt > character.updatedAt
        ? update.attempt.observedAt
        : character.updatedAt
  }

  async findCharacterByNickname(nickname: string) {
    const normalized = nickname.toLocaleLowerCase('ko-KR')
    const character = [...this.characters.values()]
      .filter(
        (entry) =>
          entry.nickname.toLocaleLowerCase('ko-KR') === normalized ||
          entry.aliases.some(
            (alias) => alias.toLocaleLowerCase('ko-KR') === normalized,
          ),
      )
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0]
    return character ? structuredClone(character) : null
  }

  async findCharacterByOcid(ocid: string) {
    const character = this.characters.get(ocid)
    return character ? structuredClone(character) : null
  }

  async findActiveCollectionRun(nickname: string) {
    const run = [...this.collectionRuns.values()]
      .filter(
        (entry) =>
          entry.nickname === nickname && !isTerminalStatus(entry.status),
      )
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt))[0]
    return run ? structuredClone(run) : null
  }

  async createCollectionRun(input: {
    nickname: string
    qos: CollectionRunQoS
    createdAt: string
  }) {
    const active = await this.findActiveCollectionRun(input.nickname)
    if (active) return active
    const run: CollectionRun = {
      id: randomUUID(),
      nickname: input.nickname,
      qos: input.qos,
      status: 'queued',
      total: 1,
      completed: 0,
      succeeded: 0,
      partial: 0,
      failed: 0,
      completedSteps: [],
      sequence: 0,
      createdAt: input.createdAt,
      updatedAt: input.createdAt,
    }
    this.collectionRuns.set(run.id, run)
    return structuredClone(run)
  }

  async startCollectionRun(input: {
    runId: string
    total: number
    updatedAt: string
  }) {
    const run = this.collectionRuns.get(input.runId)
    if (!run) return null
    if (isTerminalStatus(run.status)) return structuredClone(run)
    run.status = 'running'
    run.total = input.total
    run.updatedAt = input.updatedAt
    run.sequence += 1
    return structuredClone(run)
  }

  async recordCollectionStep(input: {
    runId: string
    stepId: string
    outcome: CollectionStepOutcome
    updatedAt: string
    message?: string
  }) {
    const run = this.collectionRuns.get(input.runId)
    if (!run) return null
    if (isTerminalStatus(run.status)) return structuredClone(run)
    if (run.completedSteps.includes(input.stepId)) return structuredClone(run)
    run.completed += 1
    run[input.outcome] += 1
    run.completedSteps.push(input.stepId)
    run.updatedAt = input.updatedAt
    run.sequence += 1
    if (input.message !== undefined) run.message = input.message
    if (run.completed >= run.total) run.status = terminalStatus(run)
    else run.status = 'running'
    return structuredClone(run)
  }

  async failCollectionRun(input: {
    runId: string
    stepId: string
    updatedAt: string
    message: string
  }) {
    const run = this.collectionRuns.get(input.runId)
    if (!run) return null
    if (isTerminalStatus(run.status)) return structuredClone(run)
    run.failed += 1
    if (!run.completedSteps.includes(input.stepId))
      run.completedSteps.push(input.stepId)
    run.completed = Math.max(run.completed, run.total)
    run.status = terminalStatus(run)
    run.sequence += 1
    run.updatedAt = input.updatedAt
    run.message = input.message
    return structuredClone(run)
  }

  async getCollectionRun(runId: string) {
    const run = this.collectionRuns.get(runId)
    return run ? structuredClone(run) : null
  }

  async findQueuedCollectionRuns(input: {
    updatedBefore: string
    limit: number
  }) {
    if (!Number.isInteger(input.limit) || input.limit < 1)
      throw new TypeError('queued run 조회 limit은 양의 정수여야 합니다.')
    return [...this.collectionRuns.values()]
      .filter(
        (run) =>
          run.status === 'queued' && run.updatedAt <= input.updatedBefore,
      )
      .sort(
        (left, right) =>
          left.updatedAt.localeCompare(right.updatedAt) ||
          left.id.localeCompare(right.id),
      )
      .slice(0, input.limit)
      .map((run) => structuredClone(run))
  }

  async recordCollectionDispatchAttempt(input: {
    runId: string
    expectedUpdatedAt: string
    attemptedAt: string
  }) {
    const run = this.collectionRuns.get(input.runId)
    if (!run) return null
    if (run.status !== 'queued') return structuredClone(run)
    if (run.updatedAt !== input.expectedUpdatedAt) return structuredClone(run)
    run.updatedAt =
      input.attemptedAt > run.updatedAt ? input.attemptedAt : run.updatedAt
    run.sequence += 1
    return structuredClone(run)
  }

  async close() {}
}

const terminalStatus = (run: CollectionRun) => {
  if (run.failed === 0 && run.partial === 0) return 'completed' as const
  if (run.succeeded === 0 && run.partial === 0) return 'failed' as const
  return 'partial' as const
}

const isTerminalStatus = (status: CollectionRun['status']) =>
  status === 'completed' || status === 'partial' || status === 'failed'

const copyFetchOptionals = (input: RawFetchInput, target: FetchObservation) => {
  if (input.status !== undefined) target.status = input.status
  if (input.contentType !== undefined) target.contentType = input.contentType
  if (input.nexonErrorCode !== undefined)
    target.nexonErrorCode = input.nexonErrorCode
  if (input.retryAfter !== undefined) target.retryAfter = input.retryAfter
  if (input.errorCode !== undefined) target.errorCode = input.errorCode
}
