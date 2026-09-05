import {
  legacyEndpointRegistry,
  type LegacyEndpointId,
  type LegacyEndpointQueries,
} from './registry.js'
import type {
  NexonRequestMetadata,
  NexonTransport,
  NexonTransportRequest,
  NexonTransportResult,
} from './transport.js'

const DEFAULT_BASE_URL = 'https://open.api.nexon.com/maplestory/v1'
const DEFAULT_TIMEOUT_MS = 5_000

export interface NexonRequestOptions {
  timeoutMs?: number
}

export interface FetchNexonTransportOptions {
  apiKey: string
  baseUrl?: string
  fetch?: typeof globalThis.fetch
}

export interface NexonClientOptions {
  defaultTimeoutMs?: number
}

const elapsedMilliseconds = (startedAt: number): number =>
  Math.max(0, performance.now() - startedAt)

const requestMetadata = (
  request: NexonTransportRequest,
): NexonRequestMetadata => ({
  endpoint: request.endpoint,
  path: request.path,
  query: request.query,
})

const parseNexonErrorCode = (body: Uint8Array): string | null => {
  try {
    const parsed: unknown = JSON.parse(new TextDecoder().decode(body))
    if (typeof parsed !== 'object' || parsed === null) {
      return null
    }

    const error = Reflect.get(parsed, 'error')
    if (typeof error !== 'object' || error === null) {
      return null
    }

    for (const key of ['name', 'code', 'errorCode', 'error_code']) {
      const value = Reflect.get(error, key)
      if (typeof value === 'string' || typeof value === 'number') {
        return String(value)
      }
    }
  } catch {
    return null
  }
  return null
}

const normalizeBaseUrl = (value: string): URL => {
  const url = new URL(value.endsWith('/') ? value : `${value}/`)
  if (!['https:', 'http:'].includes(url.protocol)) {
    throw new TypeError('Nexon base URL은 HTTP(S)여야 합니다.')
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new TypeError(
      'Nexon base URL에 인증 정보나 query를 넣을 수 없습니다.',
    )
  }
  return url
}

const redactSecret = (value: string, secret: string): string =>
  value.split(secret).join('[REDACTED]')

const errorCode = (error: unknown, secret: string): string | null => {
  if (typeof error !== 'object' || error === null) {
    return null
  }
  const code = Reflect.get(error, 'code')
  return typeof code === 'string' ? redactSecret(code, secret) : null
}

const errorMessage = (error: unknown, secret: string): string => {
  const message = error instanceof Error ? error.message : String(error)
  return redactSecret(message, secret)
}

export class FetchNexonTransport implements NexonTransport {
  readonly #apiKey: string
  readonly #baseUrl: URL
  readonly #fetch: typeof globalThis.fetch

  constructor(options: FetchNexonTransportOptions) {
    this.#apiKey = options.apiKey.trim()
    if (this.#apiKey.length === 0) {
      throw new TypeError('Nexon API key가 비어 있습니다.')
    }
    this.#baseUrl = normalizeBaseUrl(options.baseUrl ?? DEFAULT_BASE_URL)
    this.#fetch = options.fetch ?? globalThis.fetch
  }

  async execute(request: NexonTransportRequest): Promise<NexonTransportResult> {
    const url = new URL(request.path.slice(1), this.#baseUrl)
    for (const [key, value] of Object.entries(request.query)) {
      url.searchParams.set(key, value)
    }

    const controller = new AbortController()
    let timedOut = false
    const timeout = setTimeout(() => {
      timedOut = true
      controller.abort()
    }, request.timeoutMs)
    const startedAt = performance.now()

    try {
      const response = await this.#fetch(url, {
        method: 'GET',
        redirect: 'error',
        headers: {
          accept: 'application/json',
          'x-nxopen-api-key': this.#apiKey,
        },
        signal: controller.signal,
      })
      const body = new Uint8Array(await response.arrayBuffer())
      return {
        kind: 'response',
        request: requestMetadata(request),
        latencyMs: elapsedMilliseconds(startedAt),
        status: response.status,
        ok: response.ok,
        contentType: response.headers.get('content-type'),
        retryAfter: response.headers.get('retry-after'),
        body,
        nexonErrorCode: parseNexonErrorCode(body),
      }
    } catch (error: unknown) {
      const latencyMs = elapsedMilliseconds(startedAt)
      if (timedOut) {
        return {
          kind: 'timeout',
          request: requestMetadata(request),
          latencyMs,
          timeoutMs: request.timeoutMs,
        }
      }
      return {
        kind: 'transport-error',
        request: requestMetadata(request),
        latencyMs,
        code: errorCode(error, this.#apiKey),
        message: errorMessage(error, this.#apiKey),
      }
    } finally {
      clearTimeout(timeout)
    }
  }
}

export class NexonClient {
  readonly #transport: NexonTransport
  readonly #defaultTimeoutMs: number

  constructor(transport: NexonTransport, options: NexonClientOptions = {}) {
    this.#transport = transport
    this.#defaultTimeoutMs = options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS
    if (
      !Number.isFinite(this.#defaultTimeoutMs) ||
      this.#defaultTimeoutMs <= 0
    ) {
      throw new TypeError('기본 timeout은 양수여야 합니다.')
    }
  }

  request<Endpoint extends LegacyEndpointId>(
    endpoint: Endpoint,
    input: LegacyEndpointQueries[Endpoint],
    options: NexonRequestOptions = {},
  ): Promise<NexonTransportResult> {
    const timeoutMs = options.timeoutMs ?? this.#defaultTimeoutMs
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
      throw new TypeError('timeout은 양수여야 합니다.')
    }

    const definition = legacyEndpointRegistry[endpoint] as {
      path: `/${string}`
      buildQuery: (
        value: LegacyEndpointQueries[Endpoint],
      ) => Readonly<Record<string, string>>
    }
    return this.#transport.execute({
      endpoint,
      path: definition.path,
      query: definition.buildQuery(input),
      timeoutMs,
    })
  }
}

export const createFetchNexonClient = (
  options: FetchNexonTransportOptions & NexonClientOptions,
): NexonClient => {
  const clientOptions: NexonClientOptions = {}
  if (options.defaultTimeoutMs !== undefined) {
    clientOptions.defaultTimeoutMs = options.defaultTimeoutMs
  }
  return new NexonClient(new FetchNexonTransport(options), clientOptions)
}
