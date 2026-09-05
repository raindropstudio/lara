import type { ApiClient, CollectionRun } from '~/types/api.type'
import type { Character } from '~/types/character.type'
import { toCharacter } from '~/utils/characterAdapter'

const terminalStatuses = new Set<CollectionRun['status']>([
  'completed',
  'partial',
  'failed',
])

export class LaraApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'LaraApiError'
  }
}

const errorMessage = (value: unknown, fallback: string) => {
  if (
    value &&
    typeof value === 'object' &&
    'message' in value &&
    typeof value.message === 'string'
  ) {
    return value.message
  }
  return fallback
}

const fetchRun = async (api: ApiClient, runId: string) => {
  const result = await api['collection-runs']({ runId }).get()
  if (!result.data) {
    throw new LaraApiError(
      result.status,
      errorMessage(result.error?.value, '수집 상태를 확인하지 못했습니다.'),
    )
  }
  return result.data
}

export const observeCollectionRun = async (
  api: ApiClient,
  initial: CollectionRun,
  onSnapshot?: (run: CollectionRun) => void,
  {
    reconnectAttempts = 2,
    reconnectDelayMs = 150,
    pollIntervalMs = 500,
  }: {
    reconnectAttempts?: number
    reconnectDelayMs?: number
    pollIntervalMs?: number
  } = {},
) => {
  let latest = initial
  onSnapshot?.(latest)
  if (terminalStatuses.has(latest.status)) return latest

  for (let attempt = 0; attempt < reconnectAttempts; attempt += 1) {
    try {
      const eventResult = await api['collection-runs']({
        runId: initial.id,
      }).events.get({
        query: { after: latest.sequence.toString() },
      })

      if (eventResult.data) {
        for await (const event of eventResult.data) {
          latest = event.data
          onSnapshot?.(latest)
          if (terminalStatuses.has(latest.status)) return latest
        }
      }
    } catch {
      // SSE 연결 오류는 최신 sequence부터 재연결하거나 polling으로 복구한다.
    }

    if (attempt + 1 < reconnectAttempts && reconnectDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, reconnectDelayMs))
    }
  }

  while (!terminalStatuses.has(latest.status)) {
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs))
    latest = await fetchRun(api, initial.id)
    onSnapshot?.(latest)
  }
  return latest
}

export const fetchCharacter = async (nickname: string): Promise<Character> => {
  const result = await useNuxtApp().$api.characters({ nickname }).get()
  if (!result.data) {
    throw new LaraApiError(
      result.status,
      errorMessage(result.error?.value, '캐릭터 정보를 가져오지 못했습니다.'),
    )
  }
  return toCharacter(result.data)
}

export const collectCharacter = async (
  nickname: string,
  onSnapshot?: (run: CollectionRun) => void,
): Promise<Character> => {
  const api = useNuxtApp().$api
  const result = await api.characters({ nickname }).collections.post()
  if (!result.data) {
    throw new LaraApiError(
      result.status,
      errorMessage(result.error?.value, '캐릭터 수집을 시작하지 못했습니다.'),
    )
  }

  const completed = await observeCollectionRun(api, result.data, onSnapshot)
  if (completed.status === 'failed') {
    throw new LaraApiError(
      502,
      completed.message ?? '캐릭터 수집에 실패했습니다.',
    )
  }
  return fetchCharacter(nickname)
}

export const loadCharacter = async (nickname: string) => {
  try {
    return await fetchCharacter(nickname)
  } catch (error: unknown) {
    if (error instanceof LaraApiError && error.status === 404) {
      return collectCharacter(nickname)
    }
    throw error
  }
}

export const useCharacter = (nickname: string) =>
  useLazyAsyncData(`character:${nickname}`, () => loadCharacter(nickname))
