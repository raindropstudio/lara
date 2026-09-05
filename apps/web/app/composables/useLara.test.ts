import { describe, expect, it } from 'vitest'

import type { ApiClient, CollectionRun } from '~/types/api.type'
import { observeCollectionRun } from './useLara'

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
