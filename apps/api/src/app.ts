import { node } from '@elysiajs/node'
import { Elysia, t } from 'elysia'

export const createApp = () =>
  new Elysia({ adapter: node() }).get(
    '/health',
    () => ({ service: 'api' as const, status: 'ok' as const }),
    {
      response: t.Object({
        service: t.Literal('api'),
        status: t.Literal('ok'),
      }),
    },
  )
