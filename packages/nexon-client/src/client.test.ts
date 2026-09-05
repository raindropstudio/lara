import { describe, expect, it, vi } from 'vitest'

import { createFetchNexonClient } from './client.js'

describe('Nexon fetch client', () => {
  it('응답 byte와 안전한 요청 정보, Nexon 오류 코드를 반환한다', async () => {
    const apiKey = 'fixture-api-key-never-return'
    const raw = new TextEncoder().encode(
      '{"error":{"name":"OPENAPI00007","message":"limit"}}\n',
    )
    const fetchMock = vi.fn(
      async (
        _input: Parameters<typeof fetch>[0],
        init?: Parameters<typeof fetch>[1],
      ) => {
        expect(new Headers(init?.headers).get('x-nxopen-api-key')).toBe(apiKey)
        return new Response(raw, {
          status: 429,
          headers: { 'content-type': 'application/json; charset=utf-8' },
        })
      },
    )
    const client = createFetchNexonClient({
      apiKey,
      fetch: fetchMock as typeof fetch,
    })

    const result = await client.request('characterSkill', {
      ocid: 'ocid&a=b',
      skillGrade: '6',
    })

    expect(result.kind).toBe('response')
    if (result.kind !== 'response') return
    expect(result.status).toBe(429)
    expect(result.contentType).toBe('application/json; charset=utf-8')
    expect(result.nexonErrorCode).toBe('OPENAPI00007')
    expect(result.body).toEqual(raw)
    expect(result.request.query).toEqual({
      ocid: 'ocid&a=b',
      character_skill_grade: '6',
    })
    expect(JSON.stringify(result)).not.toContain(apiKey)

    const requestedUrl = fetchMock.mock.calls[0]?.[0]
    expect(requestedUrl).toBeInstanceOf(URL)
    expect((requestedUrl as URL).searchParams.get('ocid')).toBe('ocid&a=b')
  })

  it('timeout과 transport 오류를 구분하고 secret을 제거한다', async () => {
    const apiKey = 'transport-secret-value'
    const hangingFetch = vi.fn(
      (
        _input: Parameters<typeof fetch>[0],
        init?: Parameters<typeof fetch>[1],
      ) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('aborted', 'AbortError'))
          })
        }),
    )
    const timeoutClient = createFetchNexonClient({
      apiKey,
      fetch: hangingFetch as typeof fetch,
    })
    const timeout = await timeoutClient.request(
      'characterBasic',
      { ocid: 'ocid-1' },
      { timeoutMs: 5 },
    )
    expect(timeout.kind).toBe('timeout')

    const failedFetch = vi.fn(async () => {
      throw Object.assign(new Error(`socket ${apiKey}`), {
        code: `ECONNRESET-${apiKey}`,
      })
    })
    const errorClient = createFetchNexonClient({
      apiKey,
      fetch: failedFetch as typeof fetch,
    })
    const transportError = await errorClient.request('characterBasic', {
      ocid: 'ocid-1',
    })
    expect(transportError).toMatchObject({
      kind: 'transport-error',
      code: 'ECONNRESET-[REDACTED]',
      message: 'socket [REDACTED]',
    })
    expect(JSON.stringify(transportError)).not.toContain(apiKey)
  })
})
