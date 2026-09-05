import { cors } from '@elysia/cors'
import { node } from '@elysia/node'
import { MemoryDataStore, type DataStore } from '@lara/data-store'
import type { CollectionQueue } from '@lara/jobs'
import { Elysia, t } from 'elysia'

import { characterRoutes } from './features/character/routes.js'
import { collectionRoutes } from './features/collection/routes.js'

const healthyResponse = t.Object({
  service: t.Literal('api'),
  status: t.Literal('ok'),
})

const unavailableResponse = t.Object({
  code: t.Literal('NOT_READY'),
  message: t.String(),
})

export type AppOptions = {
  checkReadiness?: () => boolean | Promise<boolean>
  store?: DataStore
  queue?: CollectionQueue
  collectionEventsPollIntervalMs?: number
  corsOrigins?: readonly string[]
}

export const defaultCorsOrigins = [
  'http://127.0.0.1:3000',
  'http://localhost:3000',
] as const

const normalizeCorsOrigin = (value: string): string => {
  const url = new URL(value)
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    throw new TypeError(`CORS origin 형식이 잘못됐습니다: ${value}`)
  }
  return url.origin
}

export const parseCorsOrigins = (value: string | undefined): string[] => {
  const entries = value
    ?.split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
  return [
    ...new Set(
      (entries && entries.length > 0 ? entries : defaultCorsOrigins).map(
        normalizeCorsOrigin,
      ),
    ),
  ]
}

export const createApp = ({
  checkReadiness = () => true,
  store = new MemoryDataStore(),
  queue,
  collectionEventsPollIntervalMs,
  corsOrigins = defaultCorsOrigins,
}: AppOptions = {}) => {
  const allowedCorsOrigins = new Set(corsOrigins.map(normalizeCorsOrigin))

  return new Elysia({ adapter: node() })
    .use(
      cors({
        origin: (request) => {
          const origin = request.headers.get('origin')
          return origin !== null && allowedCorsOrigins.has(origin)
        },
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['content-type'],
        exposeHeaders: [
          'warning',
          'x-lara-compatibility',
          'x-lara-incomplete-sections',
          'x-lara-stale-sections',
          'x-lara-update-ignored',
        ],
        credentials: false,
      }),
    )
    .get(
      '/health',
      () => ({ service: 'api' as const, status: 'ok' as const }),
      { response: healthyResponse },
    )
    .get(
      '/health/ready',
      async ({ status }) => {
        if (!(await checkReadiness())) {
          return status(503, {
            code: 'NOT_READY' as const,
            message: 'API 의존성이 준비되지 않았습니다.',
          })
        }

        return { service: 'api' as const, status: 'ok' as const }
      },
      {
        response: {
          200: healthyResponse,
          503: unavailableResponse,
        },
      },
    )
    .use(characterRoutes(store))
    .use(
      collectionRoutes({
        store,
        queue,
        ...(collectionEventsPollIntervalMs === undefined
          ? {}
          : { pollIntervalMs: collectionEventsPollIntervalMs }),
      }),
    )
}
