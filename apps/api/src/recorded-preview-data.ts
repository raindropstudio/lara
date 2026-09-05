import { fileURLToPath } from 'node:url'

import { CharacterCollector } from '@lara/character-pipeline'
import { MemoryDataStore } from '@lara/data-store'
import type { CollectionQueue } from '@lara/jobs'
import { NexonClient } from '@lara/nexon-client'
import { loadFixtureManifest, loadFixtureTransport } from '@lara/nexon-fixtures'

export const partyFixturePath = fileURLToPath(
  new URL(
    '../../../fixtures/nexon/recorded/party-inspection/manifest.json',
    import.meta.url,
  ),
)

export const createRecordedPreviewData = async () => {
  const manifest = await loadFixtureManifest(partyFixturePath)
  const store = new MemoryDataStore()
  const names = manifest.cases.map((entry) => entry.character.nickname)
  const createCollector = (
    transport: Awaited<ReturnType<typeof loadFixtureTransport>>,
  ) =>
    new CharacterCollector({
      store,
      client: new NexonClient(transport),
      // 재생 시각으로 오래된 기록을 최신 자료처럼 표시하지 않는다.
      now: () => new Date(manifest.recordedAt),
    })
  const transport = await loadFixtureTransport(partyFixturePath)
  const collector = createCollector(transport)
  const reports = []
  for (const name of names) reports.push(await collector.collectFull(name))
  transport.assertAllConsumed()

  const queue: CollectionQueue = {
    async enqueueCollection(job) {
      // HTTP 응답 후 저장된 응답만 재생한다. 실제 Nexon으로 fallback하지 않는다.
      setTimeout(() => {
        void (async () => {
          try {
            if (!names.includes(job.nickname))
              throw new Error('기록에 없는 캐릭터입니다.')
            await store.startCollectionRun({
              runId: job.runId,
              total: 1,
              updatedAt: new Date().toISOString(),
            })
            const replay = createCollector(
              await loadFixtureTransport(partyFixturePath),
            )
            const report = await replay.collectFull(job.nickname)
            if (report.status === 'failed') {
              const identity = report.sections[0]
              throw new Error(
                `기록된 Nexon 조회 실패: HTTP ${identity?.upstreamStatus ?? '—'} ${identity?.nexonErrorCode ?? ''}`,
              )
            }
            await store.recordCollectionStep({
              runId: job.runId,
              stepId: 'recorded-replay',
              outcome: report.status === 'complete' ? 'succeeded' : 'partial',
              updatedAt: new Date().toISOString(),
            })
          } catch (error) {
            await store.failCollectionRun({
              runId: job.runId,
              stepId: 'recorded-replay',
              updatedAt: new Date().toISOString(),
              message:
                error instanceof Error ? error.message : '기록 재생 실패',
            })
          }
        })()
      }, 0)
    },
  }
  return { store, queue, names, reports }
}
