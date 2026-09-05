import {
  findCharacterTarget,
  fullCharacterTargets,
  type CharacterCollectionReport,
  type TargetCollectionResult,
} from '@lara/character-pipeline'
import type { DataStore } from '@lara/data-store'
import {
  type FetchCharacterSectionJob,
  type NexonFetchJob,
  type NexonFetchQueue,
} from '@lara/jobs'
import { Worker } from 'bullmq'

export type CollectorPort = {
  collect(
    nickname: string,
    targets: readonly [],
  ): Promise<CharacterCollectionReport>
  collectTarget(
    ocid: string,
    target: NonNullable<ReturnType<typeof findCharacterTarget>>,
  ): Promise<TargetCollectionResult>
}

export type ProcessorServices = {
  collector: CollectorPort
  queue: NexonFetchQueue
  store: DataStore
  now?: () => Date
  rateLimit?: (durationMs: number) => Promise<never>
}

export const createNexonJobProcessor = (services: ProcessorServices) => {
  const now = services.now ?? (() => new Date())
  const rateLimit =
    services.rateLimit ??
    (async () => {
      throw Worker.RateLimitError()
    })

  return async (data: NexonFetchJob) => {
    if (data.kind === 'resolve-character') {
      const existing = await services.store.getCollectionRun(data.runId)
      if (!existing) throw new Error(`수집 run이 없습니다: ${data.runId}`)
      if (isTerminalRun(existing.status)) return

      const report = await services.collector.collect(data.nickname, [])
      if (!report.ocid) {
        const identity = report.sections[0]
        if (identity?.upstreamStatus === 429) {
          await rateLimit(identity.retryAfterMs ?? 1_000)
        }
        if (identity && isRetryableReport(identity)) {
          throw new Error(
            `재시도 가능한 Nexon OCID 오류: ${identity.nexonErrorCode ?? identity.upstreamStatus ?? 'transport'}`,
          )
        }
        await services.store.failCollectionRun({
          runId: data.runId,
          stepId: 'resolve-character',
          updatedAt: now().toISOString(),
          message: '캐릭터 OCID를 확인할 수 없습니다.',
        })
        return
      }

      const started = await services.store.startCollectionRun({
        runId: data.runId,
        total: fullCharacterTargets.length,
        updatedAt: now().toISOString(),
      })
      if (!started) throw new Error(`수집 run이 없습니다: ${data.runId}`)
      if (isTerminalRun(started.status)) return
      const sections: FetchCharacterSectionJob[] = fullCharacterTargets.map(
        ({ sectionId }) => ({
          kind: 'fetch-character-section',
          runId: data.runId,
          nickname: data.nickname,
          ocid: report.ocid as string,
          sectionId,
          qos: data.qos,
        }),
      )
      await services.queue.enqueueSections(sections)
      return
    }

    const existing = await services.store.getCollectionRun(data.runId)
    if (!existing) throw new Error(`수집 run이 없습니다: ${data.runId}`)
    if (isTerminalRun(existing.status)) return
    if (existing.completedSteps.includes(data.sectionId)) return

    const target = findCharacterTarget(data.sectionId)
    if (!target) throw new Error(`등록되지 않은 section: ${data.sectionId}`)
    const result = await services.collector.collectTarget(data.ocid, target)
    if (result.report.upstreamStatus === 429) {
      await rateLimit(result.report.retryAfterMs ?? 1_000)
    }
    if (isRetryableReport(result.report)) {
      throw new Error(
        `재시도 가능한 Nexon 오류: ${result.report.nexonErrorCode ?? result.report.upstreamStatus ?? 'transport'}`,
      )
    }
    await services.store.recordCollectionStep({
      runId: data.runId,
      stepId: data.sectionId,
      outcome:
        result.report.status === 'complete'
          ? 'succeeded'
          : result.report.status === 'partial'
            ? 'partial'
            : 'failed',
      updatedAt: now().toISOString(),
      ...(result.report.status === 'failed' ||
      result.report.status === 'unavailable'
        ? { message: `${data.sectionId} 수집 실패` }
        : {}),
    })
  }
}

const isTerminalRun = (
  status: 'queued' | 'running' | 'completed' | 'partial' | 'failed',
) => status === 'completed' || status === 'partial' || status === 'failed'

const isRetryableReport = (report: TargetCollectionResult['report']) => {
  if (report.status !== 'unavailable') return false
  if (report.upstreamStatus === undefined) return true
  if (report.upstreamStatus >= 500) return true
  return ['OPENAPI00009', 'OPENAPI00010', 'OPENAPI00011'].includes(
    report.nexonErrorCode ?? '',
  )
}

export const recordFinalJobFailure = async (
  data: NexonFetchJob,
  store: DataStore,
  message: string,
  now = new Date(),
) => {
  if (data.kind === 'resolve-character') {
    await store.failCollectionRun({
      runId: data.runId,
      stepId: 'resolve-character',
      updatedAt: now.toISOString(),
      message,
    })
    return
  }
  await store.recordCollectionStep({
    runId: data.runId,
    stepId: data.sectionId,
    outcome: 'failed',
    updatedAt: now.toISOString(),
    message,
  })
}
