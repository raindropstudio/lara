import { afterEach, describe, expect, it } from 'vitest'
import type { Server } from 'elysia/universal/server'
import { MemoryDataStore } from '@lara/data-store'

import { createApp } from './app.js'
import { getServerUrl, startServer } from './server.js'

const describeNetwork =
  process.env.RUN_NETWORK_TESTS === '1' ? describe : describe.skip

describeNetwork('Node adapter', () => {
  let server: Server | undefined

  afterEach(async () => {
    await server?.stop()
  })

  it('실제 HTTP 요청을 처리한다', async () => {
    server = await startServer(createApp(), {
      hostname: '127.0.0.1',
      port: 0,
    })

    const response = await fetch(new URL('/health', getServerUrl(server)))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      service: 'api',
      status: 'ok',
    })
  })

  it('실제 HTTP SSE가 새 snapshot을 보내고 terminal에서 끝난다', async () => {
    const store = new MemoryDataStore()
    const run = await store.createCollectionRun({
      nickname: '라라',
      qos: 'interactive',
      createdAt: '2026-08-31T00:00:00.000Z',
    })
    server = await startServer(
      createApp({ store, collectionEventsPollIntervalMs: 1 }),
      { hostname: '127.0.0.1', port: 0 },
    )

    const complete = (async () => {
      await new Promise((resolve) => setTimeout(resolve, 10))
      await store.startCollectionRun({
        runId: run.id,
        total: 1,
        updatedAt: '2026-08-31T00:00:01.000Z',
      })
      await store.recordCollectionStep({
        runId: run.id,
        stepId: 'characterBasic',
        outcome: 'succeeded',
        updatedAt: '2026-08-31T00:00:02.000Z',
      })
    })()

    const response = await fetch(
      new URL(
        `/collection-runs/${run.id}/events?after=0`,
        getServerUrl(server),
      ),
    )
    const source = await response.text()
    await complete

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/event-stream')
    expect(source).toContain('event: collection-run')
    expect(source).toContain('"status":"completed"')
    expect(source).not.toContain('"status":"queued"')
  })
})
