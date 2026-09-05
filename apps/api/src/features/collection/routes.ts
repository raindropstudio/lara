import { setTimeout as delay } from 'node:timers/promises'

import type { CollectionRun, DataStore } from '@lara/data-store'
import type { CollectionQueue } from '@lara/jobs'
import { Elysia, sse, t } from 'elysia'

import {
  collectionQueueUnavailableSchema,
  collectionRunNotFoundSchema,
  collectionRunSchema,
} from './schema.js'

const terminalStatuses = new Set<CollectionRun['status']>([
  'completed',
  'partial',
  'failed',
])

export type CollectionRouteOptions = {
  store: DataStore
  queue: CollectionQueue | undefined
  pollIntervalMs?: number
  now?: () => Date
}

const streamCollectionRun = async function* (
  store: DataStore,
  initial: CollectionRun,
  after: number,
  pollIntervalMs: number,
  signal: AbortSignal,
) {
  let snapshot: CollectionRun | null = initial
  let sequence = after

  while (snapshot) {
    if (snapshot.sequence > sequence) {
      sequence = snapshot.sequence
      yield sse({
        id: sequence,
        event: 'collection-run',
        data: snapshot,
      })
    }
    if (terminalStatuses.has(snapshot.status) || signal.aborted) return

    try {
      await delay(pollIntervalMs, undefined, { signal })
    } catch (error: unknown) {
      if (signal.aborted) return
      throw error
    }
    snapshot = await store.getCollectionRun(initial.id)
  }
}

export const collectionRoutes = ({
  store,
  queue,
  pollIntervalMs = 250,
  now = () => new Date(),
}: CollectionRouteOptions) => {
  if (!Number.isInteger(pollIntervalMs) || pollIntervalMs < 1) {
    throw new TypeError(
      'collection event poll interval은 양의 정수여야 합니다.',
    )
  }

  return new Elysia({ name: 'collection-routes' })
    .post(
      '/characters/:nickname/collections',
      async ({ params, status }) => {
        if (!queue) {
          return status(503, {
            code: 'COLLECTION_QUEUE_UNAVAILABLE' as const,
            message: '수집 queue가 구성되지 않았습니다.',
          })
        }

        const active = await store.findActiveCollectionRun(params.nickname)
        if (active) return status(202, active)

        const run = await store.createCollectionRun({
          nickname: params.nickname,
          qos: 'interactive',
          createdAt: now().toISOString(),
        })
        try {
          await queue.enqueueCollection({
            kind: 'resolve-character',
            runId: run.id,
            nickname: run.nickname,
            qos: 'interactive',
          })
        } catch {
          await store.failCollectionRun({
            runId: run.id,
            stepId: 'enqueue-collection',
            updatedAt: now().toISOString(),
            message: '수집 job enqueue 실패',
          })
          return status(503, {
            code: 'COLLECTION_QUEUE_UNAVAILABLE' as const,
            message: '수집 queue에 요청을 등록하지 못했습니다.',
          })
        }
        const dispatched = await store
          .recordCollectionDispatchAttempt({
            runId: run.id,
            expectedUpdatedAt: run.updatedAt,
            attemptedAt: now().toISOString(),
          })
          .catch(() => {
            console.error(`수집 dispatch 시각 기록 실패: ${run.id}`)
            return null
          })
        return status(202, dispatched ?? run)
      },
      {
        params: t.Object({
          nickname: t.String({ minLength: 1, maxLength: 32 }),
        }),
        response: {
          202: collectionRunSchema,
          503: collectionQueueUnavailableSchema,
        },
      },
    )
    .get(
      '/collection-runs/:runId',
      async ({ params, status }) => {
        const run = await store.getCollectionRun(params.runId)
        if (!run) {
          return status(404, {
            code: 'COLLECTION_RUN_NOT_FOUND' as const,
            message: '수집 실행을 찾을 수 없습니다.',
          })
        }
        return run
      },
      {
        params: t.Object({ runId: t.String({ minLength: 1 }) }),
        response: {
          200: collectionRunSchema,
          404: collectionRunNotFoundSchema,
        },
      },
    )
    .get(
      '/collection-runs/:runId/events',
      async ({ params, query, request, set, status }) => {
        const run = await store.getCollectionRun(params.runId)
        if (!run) {
          return status(404, {
            code: 'COLLECTION_RUN_NOT_FOUND' as const,
            message: '수집 실행을 찾을 수 없습니다.',
          })
        }

        set.headers['cache-control'] = 'no-cache'
        set.headers['x-accel-buffering'] = 'no'
        return streamCollectionRun(
          store,
          run,
          query.after === undefined ? -1 : Number(query.after),
          pollIntervalMs,
          request.signal,
        )
      },
      {
        params: t.Object({ runId: t.String({ minLength: 1 }) }),
        query: t.Object({
          after: t.Optional(
            t.String({ pattern: '^(0|[1-9][0-9]*)$', maxLength: 15 }),
          ),
        }),
      },
    )
}
