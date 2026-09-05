import { randomUUID } from 'node:crypto'
import {
  Binary,
  MongoServerError,
  type Collection,
  type Db,
  MongoClient,
  type WithId,
} from 'mongodb'

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

type RawPayloadDocument = {
  _id: string
  body: Binary
  contentType?: string
  size: number
  firstSeenAt: string
}

type FetchDocument = Omit<FetchObservation, 'id'> & { _id: string }
type ParseRunDocument = Omit<ParseRun, 'id'> & { _id: string }
type CharacterDocument = Omit<CharacterCurrent, 'identityObservedAt'> & {
  _id: string
  identityObservedAt?: string
}
type CollectionRunDocument = Omit<CollectionRun, 'id'> & { _id: string }

export type MongoDataStoreOptions = {
  client: MongoClient
  databaseName: string
  ownsClient?: boolean
}

export class MongoDataStore implements DataStore {
  private readonly db: Db
  private readonly ownsClient: boolean

  constructor(private readonly options: MongoDataStoreOptions) {
    this.db = options.client.db(options.databaseName)
    this.ownsClient = options.ownsClient ?? false
  }

  static async connect(uri: string, databaseName: string) {
    const client = new MongoClient(uri)
    await client.connect()
    return new MongoDataStore({ client, databaseName, ownsClient: true })
  }

  private get rawPayloads(): Collection<RawPayloadDocument> {
    return this.db.collection('raw_payloads')
  }

  private get fetches(): Collection<FetchDocument> {
    return this.db.collection('fetches')
  }

  private get parseRuns(): Collection<ParseRunDocument> {
    return this.db.collection('parse_runs')
  }

  private get characters(): Collection<CharacterDocument> {
    return this.db.collection('character_current')
  }

  private get collectionRuns(): Collection<CollectionRunDocument> {
    return this.db.collection('collection_runs')
  }

  async isReady() {
    try {
      return (await this.db.command({ ping: 1 })).ok === 1
    } catch {
      return false
    }
  }

  async ensureIndexes() {
    await Promise.all([
      this.fetches.createIndex({ endpointId: 1, fetchedAt: -1 }),
      this.parseRuns.createIndex(
        { fetchId: 1, parserVersion: 1 },
        { unique: true },
      ),
      this.characters.createIndex({ ocid: 1 }, { unique: true }),
      this.characters.createIndex({ nickname: 1, updatedAt: -1 }),
      this.characters.createIndex({ aliases: 1 }),
      this.collectionRuns.createIndex({ status: 1, updatedAt: 1, _id: 1 }),
      this.collectionRuns.createIndex(
        { nickname: 1 },
        {
          unique: true,
          partialFilterExpression: {
            status: { $in: ['queued', 'running'] },
          },
        },
      ),
    ])
  }

  async saveFetch(input: RawFetchInput) {
    const id = randomUUID()
    const rawHash = input.body ? sha256(input.body) : undefined
    if (input.body && rawHash) {
      const update: {
        $setOnInsert: Omit<RawPayloadDocument, '_id'>
      } = {
        $setOnInsert: {
          body: new Binary(input.body),
          size: input.body.byteLength,
          firstSeenAt: input.fetchedAt,
        },
      }
      if (input.contentType !== undefined)
        update.$setOnInsert.contentType = input.contentType
      await this.rawPayloads.updateOne({ _id: rawHash }, update, {
        upsert: true,
      })
    }

    const document: FetchDocument = {
      _id: id,
      endpointId: input.endpointId,
      path: input.path,
      query: { ...input.query },
      fetchedAt: input.fetchedAt,
      latencyMs: input.latencyMs,
      outcome: input.outcome,
    }
    copyFetchOptionals(input, document)
    if (rawHash) document.rawHash = rawHash
    if (input.body) document.bodySize = input.body.byteLength
    await this.fetches.insertOne(document)
    return fromFetchDocument(document)
  }

  async getRawPayload(hash: string) {
    const document = await this.rawPayloads.findOne({ _id: hash })
    if (!document) return null
    const result: StoredRawPayload = {
      hash: document._id,
      body: Uint8Array.from(document.body.buffer),
      size: document.size,
      firstSeenAt: document.firstSeenAt,
    }
    if (document.contentType !== undefined)
      result.contentType = document.contentType
    return result
  }

  async saveParseRun(input: ParseRunInput) {
    const id = randomUUID()
    const document: ParseRunDocument = { _id: id, ...structuredClone(input) }
    if (input.value !== undefined)
      document.valueHash = semanticHash(
        input.endpointId,
        input.parserVersion,
        input.value,
      )
    const result = await this.parseRuns.findOneAndUpdate(
      { fetchId: input.fetchId, parserVersion: input.parserVersion },
      { $setOnInsert: document },
      { upsert: true, returnDocument: 'after', includeResultMetadata: false },
    )
    if (!result) throw new Error('parse run 저장 결과가 없습니다.')
    return fromParseRunDocument(result)
  }

  async upsertCharacterIdentity(input: {
    ocid: string
    nickname: string
    observedAt: string
  }) {
    await this.characters.updateOne(
      { ocid: input.ocid },
      {
        $setOnInsert: {
          _id: input.ocid,
          ocid: input.ocid,
          nickname: input.nickname,
          aliases: [],
          identityObservedAt: input.observedAt,
          updatedAt: input.observedAt,
          sections: {},
        },
      },
      { upsert: true },
    )

    for (;;) {
      const existing = await this.characters.findOne({ ocid: input.ocid })
      if (!existing) throw new Error('캐릭터 identity 저장 결과가 없습니다.')
      const identityObservedAt =
        existing.identityObservedAt ?? existing.updatedAt
      if (identityObservedAt > input.observedAt)
        return fromCharacterDocument(existing)

      const aliases =
        existing.nickname === input.nickname
          ? existing.aliases
          : [
              ...new Set(
                existing.aliases
                  .filter((alias) => alias !== input.nickname)
                  .concat(existing.nickname),
              ),
            ]
      const identityVersion = existing.identityObservedAt
        ? { identityObservedAt: existing.identityObservedAt }
        : { identityObservedAt: { $exists: false } }
      const document = await this.characters.findOneAndUpdate(
        {
          _id: existing._id,
          nickname: existing.nickname,
          aliases: existing.aliases,
          ...identityVersion,
        },
        {
          $set: {
            nickname: input.nickname,
            aliases,
            identityObservedAt: input.observedAt,
          },
          $max: { updatedAt: input.observedAt },
        },
        { returnDocument: 'after', includeResultMetadata: false },
      )
      if (document) return fromCharacterDocument(document)
    }
  }

  async updateCharacterSection(update: CharacterSectionUpdate) {
    assertSafeSectionKey(update.endpointId)
    const sectionPath = `sections.${update.endpointId}`
    const observedAtPath = `${sectionPath}.currentAttempt.observedAt`
    const currentIsNotNewer = {
      ocid: update.ocid,
      $or: [
        { [observedAtPath]: { $exists: false } },
        { [observedAtPath]: { $lte: update.attempt.observedAt } },
      ],
    }
    const section: CharacterCurrent['sections'][string] = {
      currentAttempt: structuredClone(update.attempt),
    }
    if (
      update.value !== undefined &&
      update.valueHash &&
      (update.attempt.status === 'complete' ||
        update.attempt.status === 'partial')
    ) {
      section.lastKnownGood = {
        value: structuredClone(update.value),
        valueHash: update.valueHash,
        observedAt: update.attempt.observedAt,
        parserVersion: update.attempt.parserVersion,
        completeness: update.attempt.status,
      }
      await this.characters.updateOne(currentIsNotNewer, {
        $set: { [sectionPath]: section },
        $max: { updatedAt: update.attempt.observedAt },
      })
      return
    }

    await this.characters.updateOne(currentIsNotNewer, {
      $set: {
        [`${sectionPath}.currentAttempt`]: section.currentAttempt,
      },
      $max: { updatedAt: update.attempt.observedAt },
    })
  }

  async findCharacterByNickname(nickname: string) {
    const document = await this.characters.findOne(
      { $or: [{ nickname }, { aliases: nickname }] },
      { sort: { updatedAt: -1 } },
    )
    return document ? fromCharacterDocument(document) : null
  }

  async findCharacterByOcid(ocid: string) {
    const document = await this.characters.findOne({ ocid })
    return document ? fromCharacterDocument(document) : null
  }

  async findActiveCollectionRun(nickname: string) {
    const document = await this.collectionRuns.findOne(
      { nickname, status: { $in: ['queued', 'running'] } },
      { sort: { createdAt: 1, _id: 1 } },
    )
    return document ? fromCollectionRunDocument(document) : null
  }

  async createCollectionRun(input: {
    nickname: string
    qos: CollectionRunQoS
    createdAt: string
  }) {
    const document: CollectionRunDocument = {
      _id: randomUUID(),
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
    try {
      await this.collectionRuns.insertOne(document)
    } catch (error) {
      if (!(error instanceof MongoServerError) || error.code !== 11_000)
        throw error
      const active = await this.findActiveCollectionRun(input.nickname)
      if (!active) throw error
      return active
    }
    return fromCollectionRunDocument(document)
  }

  async startCollectionRun(input: {
    runId: string
    total: number
    updatedAt: string
  }) {
    const document = await this.collectionRuns.findOneAndUpdate(
      { _id: input.runId, status: { $in: ['queued', 'running'] } },
      {
        $set: {
          status: 'running',
          total: input.total,
          updatedAt: input.updatedAt,
        },
        $inc: { sequence: 1 },
      },
      { returnDocument: 'after', includeResultMetadata: false },
    )
    if (document) return fromCollectionRunDocument(document)
    return this.getCollectionRun(input.runId)
  }

  async recordCollectionStep(input: {
    runId: string
    stepId: string
    outcome: CollectionStepOutcome
    updatedAt: string
    message?: string
  }) {
    const progress: Record<string, unknown> = {
      completed: { $add: ['$completed', 1] },
      succeeded: {
        $add: ['$succeeded', input.outcome === 'succeeded' ? 1 : 0],
      },
      partial: {
        $add: [
          { $ifNull: ['$partial', 0] },
          input.outcome === 'partial' ? 1 : 0,
        ],
      },
      failed: { $add: ['$failed', input.outcome === 'failed' ? 1 : 0] },
      completedSteps: { $concatArrays: ['$completedSteps', [input.stepId]] },
      sequence: { $add: ['$sequence', 1] },
      updatedAt: input.updatedAt,
    }
    if (input.message !== undefined) progress.message = input.message
    const document = await this.collectionRuns.findOneAndUpdate(
      {
        _id: input.runId,
        status: { $in: ['queued', 'running'] },
        completedSteps: { $ne: input.stepId },
      },
      [
        { $set: progress },
        {
          $set: {
            status: {
              $cond: [
                { $gte: ['$completed', '$total'] },
                {
                  $switch: collectionTerminalStatusBranches(),
                },
                'running',
              ],
            },
          },
        },
      ],
      { returnDocument: 'after', includeResultMetadata: false },
    )
    if (!document) return this.getCollectionRun(input.runId)
    return fromCollectionRunDocument(document)
  }

  async failCollectionRun(input: {
    runId: string
    stepId: string
    updatedAt: string
    message: string
  }) {
    const document = await this.collectionRuns.findOneAndUpdate(
      {
        _id: input.runId,
        status: { $in: ['queued', 'running'] },
      },
      [
        {
          $set: {
            completed: { $max: ['$completed', '$total'] },
            succeeded: { $ifNull: ['$succeeded', 0] },
            partial: { $ifNull: ['$partial', 0] },
            failed: { $add: [{ $ifNull: ['$failed', 0] }, 1] },
            completedSteps: {
              $cond: [
                { $in: [input.stepId, '$completedSteps'] },
                '$completedSteps',
                { $concatArrays: ['$completedSteps', [input.stepId]] },
              ],
            },
            sequence: { $add: ['$sequence', 1] },
            updatedAt: input.updatedAt,
            message: input.message,
          },
        },
        {
          $set: {
            status: { $switch: collectionTerminalStatusBranches() },
          },
        },
      ],
      { returnDocument: 'after', includeResultMetadata: false },
    )
    if (document) return fromCollectionRunDocument(document)
    return this.getCollectionRun(input.runId)
  }

  async getCollectionRun(runId: string) {
    const document = await this.collectionRuns.findOne({ _id: runId })
    return document ? fromCollectionRunDocument(document) : null
  }

  async findQueuedCollectionRuns(input: {
    updatedBefore: string
    limit: number
  }) {
    if (!Number.isInteger(input.limit) || input.limit < 1)
      throw new TypeError('queued run 조회 limit은 양의 정수여야 합니다.')
    const documents = await this.collectionRuns
      .find({ status: 'queued', updatedAt: { $lte: input.updatedBefore } })
      .sort({ updatedAt: 1, _id: 1 })
      .limit(input.limit)
      .toArray()
    return documents.map(fromCollectionRunDocument)
  }

  async recordCollectionDispatchAttempt(input: {
    runId: string
    expectedUpdatedAt: string
    attemptedAt: string
  }) {
    const document = await this.collectionRuns.findOneAndUpdate(
      {
        _id: input.runId,
        status: 'queued',
        updatedAt: input.expectedUpdatedAt,
      },
      { $max: { updatedAt: input.attemptedAt }, $inc: { sequence: 1 } },
      { returnDocument: 'after', includeResultMetadata: false },
    )
    if (document) return fromCollectionRunDocument(document)
    return this.getCollectionRun(input.runId)
  }

  async close() {
    if (this.ownsClient) await this.options.client.close()
  }
}

const assertSafeSectionKey = (endpointId: string) => {
  if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(endpointId))
    throw new TypeError(`안전하지 않은 section key입니다: ${endpointId}`)
}

const copyFetchOptionals = (
  input: RawFetchInput,
  target: Omit<FetchObservation, 'id'>,
) => {
  if (input.status !== undefined) target.status = input.status
  if (input.contentType !== undefined) target.contentType = input.contentType
  if (input.nexonErrorCode !== undefined)
    target.nexonErrorCode = input.nexonErrorCode
  if (input.retryAfter !== undefined) target.retryAfter = input.retryAfter
  if (input.errorCode !== undefined) target.errorCode = input.errorCode
}

const fromFetchDocument = ({ _id, ...document }: FetchDocument) => ({
  id: _id,
  ...document,
})

const fromParseRunDocument = ({ _id, ...document }: ParseRunDocument) => ({
  id: _id,
  ...document,
})

const fromCharacterDocument = ({
  _id,
  identityObservedAt,
  ...document
}: WithId<CharacterDocument>): CharacterCurrent => {
  void _id
  return {
    ...document,
    identityObservedAt: identityObservedAt ?? document.updatedAt,
  }
}

const fromCollectionRunDocument = ({
  _id,
  partial = 0,
  ...document
}: CollectionRunDocument): CollectionRun => ({ id: _id, partial, ...document })

const collectionTerminalStatusBranches = () => ({
  branches: [
    {
      case: {
        $and: [{ $eq: ['$failed', 0] }, { $eq: ['$partial', 0] }],
      },
      then: 'completed',
    },
    {
      case: {
        $and: [{ $eq: ['$succeeded', 0] }, { $eq: ['$partial', 0] }],
      },
      then: 'failed',
    },
  ],
  default: 'partial',
})
