import { t } from 'elysia'

export const collectionRunSchema = t.Object({
  id: t.String(),
  nickname: t.String(),
  qos: t.Union([
    t.Literal('interactive'),
    t.Literal('daily-top'),
    t.Literal('repair'),
    t.Literal('backfill'),
  ]),
  status: t.Union([
    t.Literal('queued'),
    t.Literal('running'),
    t.Literal('completed'),
    t.Literal('partial'),
    t.Literal('failed'),
  ]),
  total: t.Integer({ minimum: 0 }),
  completed: t.Integer({ minimum: 0 }),
  succeeded: t.Integer({ minimum: 0 }),
  partial: t.Integer({ minimum: 0 }),
  failed: t.Integer({ minimum: 0 }),
  completedSteps: t.Array(t.String()),
  sequence: t.Integer({ minimum: 0 }),
  createdAt: t.String({ format: 'date-time' }),
  updatedAt: t.String({ format: 'date-time' }),
  message: t.Optional(t.String()),
})

export const collectionRunNotFoundSchema = t.Object({
  code: t.Literal('COLLECTION_RUN_NOT_FOUND'),
  message: t.String(),
})

export const collectionQueueUnavailableSchema = t.Object({
  code: t.Literal('COLLECTION_QUEUE_UNAVAILABLE'),
  message: t.String(),
})
