export type FetchOutcome = 'response' | 'timeout' | 'transport_error'

export type RawFetchInput = {
  endpointId: string
  path: string
  query: Readonly<Record<string, string>>
  fetchedAt: string
  latencyMs: number
  outcome: FetchOutcome
  status?: number
  contentType?: string
  nexonErrorCode?: string
  retryAfter?: string
  body?: Uint8Array
  errorCode?: string
}

export type FetchObservation = Omit<RawFetchInput, 'body'> & {
  id: string
  rawHash?: string
  bodySize?: number
}

export type StoredRawPayload = {
  hash: string
  body: Uint8Array
  contentType?: string
  size: number
  firstSeenAt: string
}

export type ParseIssue = {
  path: string
  code: string
  message: string
  receivedType?: string
}

export type ParseRunInput = {
  fetchId: string
  endpointId: string
  parserVersion: string
  status: 'complete' | 'partial' | 'failed'
  parsedAt: string
  issues: ParseIssue[]
  unknownPaths: string[]
  value?: unknown
}

export type ParseRun = ParseRunInput & {
  id: string
  valueHash?: string
}

export type SectionAttempt = {
  fetchId: string
  parseRunId: string
  status: 'complete' | 'partial' | 'failed' | 'unavailable'
  observedAt: string
  parserVersion: string
  issues: ParseIssue[]
}

export type SectionValue = {
  value: unknown
  valueHash: string
  observedAt: string
  parserVersion: string
  completeness: 'complete' | 'partial'
}

export type CharacterSection = {
  currentAttempt: SectionAttempt
  lastKnownGood?: SectionValue
}

export type CharacterCurrent = {
  ocid: string
  nickname: string
  aliases: string[]
  identityObservedAt: string
  updatedAt: string
  sections: Record<string, CharacterSection>
}

export type CharacterSectionUpdate = {
  ocid: string
  endpointId: string
  attempt: SectionAttempt
  value?: unknown
  valueHash?: string
}

export type CollectionRunStatus =
  'queued' | 'running' | 'completed' | 'partial' | 'failed'

export type CollectionRunQoS =
  'interactive' | 'daily-top' | 'repair' | 'backfill'

export type CollectionRun = {
  id: string
  nickname: string
  qos: CollectionRunQoS
  status: CollectionRunStatus
  total: number
  completed: number
  succeeded: number
  partial: number
  failed: number
  completedSteps: string[]
  sequence: number
  createdAt: string
  updatedAt: string
  message?: string
}

export type CollectionStepOutcome = 'succeeded' | 'partial' | 'failed'

export interface DataStore {
  isReady(): Promise<boolean>
  ensureIndexes(): Promise<void>
  saveFetch(input: RawFetchInput): Promise<FetchObservation>
  getRawPayload(hash: string): Promise<StoredRawPayload | null>
  saveParseRun(input: ParseRunInput): Promise<ParseRun>
  upsertCharacterIdentity(input: {
    ocid: string
    nickname: string
    observedAt: string
  }): Promise<CharacterCurrent>
  updateCharacterSection(update: CharacterSectionUpdate): Promise<void>
  findCharacterByNickname(nickname: string): Promise<CharacterCurrent | null>
  findCharacterByOcid(ocid: string): Promise<CharacterCurrent | null>
  findActiveCollectionRun(nickname: string): Promise<CollectionRun | null>
  createCollectionRun(input: {
    nickname: string
    qos: CollectionRunQoS
    createdAt: string
  }): Promise<CollectionRun>
  startCollectionRun(input: {
    runId: string
    total: number
    updatedAt: string
  }): Promise<CollectionRun | null>
  recordCollectionStep(input: {
    runId: string
    stepId: string
    outcome: CollectionStepOutcome
    updatedAt: string
    message?: string
  }): Promise<CollectionRun | null>
  failCollectionRun(input: {
    runId: string
    stepId: string
    updatedAt: string
    message: string
  }): Promise<CollectionRun | null>
  getCollectionRun(runId: string): Promise<CollectionRun | null>
  findQueuedCollectionRuns(input: {
    updatedBefore: string
    limit: number
  }): Promise<CollectionRun[]>
  recordCollectionDispatchAttempt(input: {
    runId: string
    expectedUpdatedAt: string
    attemptedAt: string
  }): Promise<CollectionRun | null>
  close(): Promise<void>
}
