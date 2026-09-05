import { describe, expect, it, vi } from 'vitest'

import type { ApiClient, CollectionRun } from '~/types/api.type'
import { observeCollectionRun, createCharacterClient } from './useLara'

const run = (
  status: CollectionRun['status'],
  sequence: number,
): CollectionRun => ({
  id: 'run-1',
  nickname: '라라',
  qos: 'interactive',
  status,
  total: 2,
  completed: status === 'queued' ? 0 : 2,
  succeeded: status === 'partial' ? 1 : 0,
  partial: 0,
  failed: status === 'partial' ? 1 : 0,
  completedSteps: status === 'queued' ? [] : ['basic', 'stat'],
  sequence,
  createdAt: '2026-08-31T00:00:00.000Z',
  updatedAt: '2026-08-31T00:00:00.000Z',
})

describe('observeCollectionRun', () => {
  it('SSE 오류 뒤 최신 sequence부터 재연결한다', async () => {
    const running = run('running', 1)
    const partial = run('partial', 2)
    const snapshots: CollectionRun[] = []
    const afterValues: string[] = []
    let connection = 0
    const api = {
      'collection-runs': () => ({
        get: async () => ({ data: partial }),
        events: {
          get: async ({ query }: { query: { after: string } }) => {
            afterValues.push(query.after)
            connection += 1
            return {
              data: (async function* () {
                if (connection === 1) {
                  yield { id: 1, event: 'collection-run', data: running }
                  throw new Error('연결 끊김')
                }
                yield { id: 2, event: 'collection-run', data: partial }
              })(),
            }
          },
        },
      }),
    } as unknown as ApiClient

    const result = await observeCollectionRun(
      api,
      run('queued', 0),
      (value) => snapshots.push(value),
      { reconnectDelayMs: 0, pollIntervalMs: 0 },
    )

    expect(result.status).toBe('partial')
    expect(snapshots.map((value) => value.status)).toEqual([
      'queued',
      'running',
      'partial',
    ])
    expect(afterValues).toEqual(['0', '1'])
  })

  it('SSE 재연결도 실패하면 GET polling으로 완료 상태를 확인한다', async () => {
    const completed = run('completed', 2)
    let polls = 0
    const api = {
      'collection-runs': () => ({
        get: async () => {
          polls += 1
          return { data: completed }
        },
        events: {
          get: async () => {
            throw new Error('SSE 연결 실패')
          },
        },
      }),
    } as unknown as ApiClient

    const result = await observeCollectionRun(
      api,
      run('queued', 0),
      undefined,
      {
        reconnectAttempts: 2,
        reconnectDelayMs: 0,
        pollIntervalMs: 0,
      },
    )

    expect(result.status).toBe('completed')
    expect(polls).toBe(1)
  })
})

describe('수집 대기 종료', () => {
  it('취소된 요청은 polling을 시작하지 않는다', async () => {
    const controller = new AbortController()
    controller.abort(new Error('화면 이탈'))
    const get = vi.fn()
    const api = { 'collection-runs': () => ({ get }) } as unknown as ApiClient
    await expect(
      observeCollectionRun(api, run('queued', 0), undefined, {
        signal: controller.signal,
      }),
    ).rejects.toThrow('화면 이탈')
    expect(get).not.toHaveBeenCalled()
  })
  it('polling 대기 중 취소하면 다음 요청을 보내지 않는다', async () => {
    const controller = new AbortController()
    const get = vi.fn()
    const api = { 'collection-runs': () => ({ get }) } as unknown as ApiClient
    const pending = observeCollectionRun(api, run('queued', 0), undefined, {
      reconnectAttempts: 0,
      pollIntervalMs: 60_000,
      signal: controller.signal,
    })
    controller.abort(new Error('제거'))
    await expect(pending).rejects.toThrow('제거')
    expect(get).not.toHaveBeenCalled()
  })
  it('404 이후 수집과 재조회에서 같은 API 인스턴스를 사용한다', async () => {
    const get = vi
      .fn()
      .mockResolvedValueOnce({ status: 404, error: { value: {} } })
      .mockResolvedValueOnce({
        status: 503,
        error: { value: { message: '재조회 실행됨' } },
      })
    const post = vi.fn().mockResolvedValue({ data: run('partial', 2) })
    const api = {
      characters: () => ({ get, collections: { post } }),
    } as unknown as ApiClient
    await expect(
      createCharacterClient(api).loadCharacter('라라'),
    ).rejects.toThrow('재조회 실행됨')
    expect(get).toHaveBeenCalledTimes(2)
    expect(post).toHaveBeenCalledOnce()
  })
})
