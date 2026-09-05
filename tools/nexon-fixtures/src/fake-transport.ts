import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

import type {
  NexonTransport,
  NexonTransportRequest,
  NexonTransportResult,
} from '@lara/nexon-client'

import { loadFixtureManifest, type FixtureResponse } from './manifest.js'
import { verifyFixtureManifest } from './verify.js'

const querySignature = (query: Readonly<Record<string, string>>): string =>
  JSON.stringify(
    Object.entries(query).sort(([left], [right]) => left.localeCompare(right)),
  )

const requestSignature = (
  endpoint: string,
  query: Readonly<Record<string, string>>,
): string => `${endpoint}:${querySignature(query)}`

interface LoadedResponse {
  response: FixtureResponse
  body: Uint8Array
}

export class FixtureTransport implements NexonTransport {
  readonly #responses: Map<string, LoadedResponse[]>
  #consumed = 0

  constructor(responses: Map<string, LoadedResponse[]>) {
    this.#responses = responses
  }

  async execute(request: NexonTransportRequest): Promise<NexonTransportResult> {
    const signature = requestSignature(request.endpoint, request.query)
    const queue = this.#responses.get(signature)
    const loaded = queue?.shift()
    if (!loaded) {
      return {
        kind: 'transport-error',
        request: {
          endpoint: request.endpoint,
          path: request.path,
          query: request.query,
        },
        latencyMs: 0,
        code: 'FIXTURE_NOT_FOUND',
        message: `일치하는 fixture가 없습니다: ${signature}`,
      }
    }

    this.#consumed += 1
    const response = loaded.response
    return {
      kind: 'response',
      request: {
        endpoint: request.endpoint,
        path: request.path,
        query: request.query,
      },
      latencyMs: response.latencyMs,
      status: response.status,
      ok: response.status >= 200 && response.status < 300,
      contentType: response.contentType,
      retryAfter: response.retryAfter ?? null,
      body: loaded.body.slice(),
      nexonErrorCode: response.nexonErrorCode ?? null,
    }
  }

  get consumedCount(): number {
    return this.#consumed
  }

  get remainingCount(): number {
    let count = 0
    for (const queue of this.#responses.values()) count += queue.length
    return count
  }

  assertAllConsumed(): void {
    if (this.remainingCount !== 0) {
      throw new Error(
        `재생하지 않은 fixture가 ${this.remainingCount}개 있습니다.`,
      )
    }
  }
}

export const loadFixtureTransport = async (
  manifestPath: string,
): Promise<FixtureTransport> => {
  const verification = await verifyFixtureManifest(manifestPath)
  if (!verification.valid) {
    throw new Error(verification.issues.join('\n'))
  }
  const manifest = await loadFixtureManifest(manifestPath)
  const root = dirname(manifestPath)
  const responses = new Map<string, LoadedResponse[]>()

  for (const fixtureCase of manifest.cases) {
    for (const response of fixtureCase.responses) {
      const signature = requestSignature(response.endpointId, response.query)
      const queue = responses.get(signature) ?? []
      queue.push({
        response,
        body: await readFile(resolve(root, response.bodyPath)),
      })
      responses.set(signature, queue)
    }
  }
  return new FixtureTransport(responses)
}
