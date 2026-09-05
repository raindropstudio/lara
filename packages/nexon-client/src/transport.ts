import type { LegacyEndpointId, SafeQuery } from './registry.js'

export interface NexonRequestMetadata {
  endpoint: LegacyEndpointId
  path: `/${string}`
  query: SafeQuery
}

export interface NexonTransportRequest extends NexonRequestMetadata {
  timeoutMs: number
}

export interface NexonResponseResult {
  kind: 'response'
  request: NexonRequestMetadata
  latencyMs: number
  status: number
  ok: boolean
  contentType: string | null
  retryAfter: string | null
  body: Uint8Array
  nexonErrorCode: string | null
}

export interface NexonTimeoutResult {
  kind: 'timeout'
  request: NexonRequestMetadata
  latencyMs: number
  timeoutMs: number
}

export interface NexonTransportErrorResult {
  kind: 'transport-error'
  request: NexonRequestMetadata
  latencyMs: number
  code: string | null
  message: string
}

export type NexonTransportResult =
  NexonResponseResult | NexonTimeoutResult | NexonTransportErrorResult

export interface NexonTransport {
  execute: (request: NexonTransportRequest) => Promise<NexonTransportResult>
}
