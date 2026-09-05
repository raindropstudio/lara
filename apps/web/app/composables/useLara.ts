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

const waitForCollection = (milliseconds: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    signal.throwIfAborted()
    const abort = () => {
      clearTimeout(timer)
      reject(signal.reason)
    }
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', abort)
      resolve()
    }, milliseconds)
    signal.addEventListener('abort', abort, { once: true })
  })

const fetchRun = async (api: ApiClient, runId: string, signal: AbortSignal) => {
  const result = await api['collection-runs']({ runId }).get({
    fetch: { signal },
  })
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
    signal = AbortSignal.timeout(120_000),
  }: {
    reconnectAttempts?: number
    reconnectDelayMs?: number
    pollIntervalMs?: number
    signal?: AbortSignal
  } = {},
) => {
  signal.throwIfAborted()
  let latest = initial
  onSnapshot?.(latest)
  if (terminalStatuses.has(latest.status)) return latest

  for (let attempt = 0; attempt < reconnectAttempts; attempt += 1) {
    try {
      const eventResult = await api['collection-runs']({
        runId: initial.id,
      }).events.get({
        query: { after: latest.sequence.toString() },
        fetch: { signal },
      })

      if (eventResult.data) {
        for await (const event of eventResult.data) {
          signal.throwIfAborted()
          if (event.data.sequence < latest.sequence) continue
          latest = event.data
          onSnapshot?.(latest)
          if (terminalStatuses.has(latest.status)) return latest
        }
      }
    } catch {
      signal.throwIfAborted()
      // SSE 연결 오류는 최신 sequence부터 재연결하거나 polling으로 복구한다.
    }

    if (attempt + 1 < reconnectAttempts && reconnectDelayMs > 0) {
      await waitForCollection(reconnectDelayMs, signal)
    }
  }

  while (!terminalStatuses.has(latest.status)) {
    await waitForCollection(pollIntervalMs, signal)
    latest = await fetchRun(api, initial.id, signal)
    onSnapshot?.(latest)
  }
  return latest
}

export const createCharacterClient = (api: ApiClient) => {
  const fetchCharacter = async (
    nickname: string,
    signal?: AbortSignal,
  ): Promise<Character> => {
    const result = await api.characters({ nickname }).get({ fetch: { signal } })
    signal?.throwIfAborted()
    if (!result.data) {
      throw new LaraApiError(
        result.status,
        errorMessage(result.error?.value, '캐릭터 정보를 가져오지 못했습니다.'),
      )
    }
    return toCharacter(result.data)
  }

  const collectCharacter = async (
    nickname: string,
    onSnapshot?: (run: CollectionRun) => void,
    signal = AbortSignal.timeout(120_000),
  ): Promise<Character> => {
    signal.throwIfAborted()
    const result = await api
      .characters({ nickname })
      .collections.post(undefined, { fetch: { signal } })
    signal.throwIfAborted()
    if (!result.data) {
      throw new LaraApiError(
        result.status,
        errorMessage(result.error?.value, '캐릭터 수집을 시작하지 못했습니다.'),
      )
    }
    const completed = await observeCollectionRun(api, result.data, onSnapshot, {
      signal,
    })
    if (completed.status === 'failed') {
      throw new LaraApiError(
        502,
        completed.message ?? '캐릭터 수집에 실패했습니다.',
      )
    }
    return fetchCharacter(nickname, signal)
  }

  const loadCharacter = async (nickname: string, signal?: AbortSignal) => {
    try {
      return await fetchCharacter(nickname, signal)
    } catch (error: unknown) {
      if (error instanceof LaraApiError && error.status === 404)
        return collectCharacter(nickname, undefined, signal)
      throw error
    }
  }
  return { fetchCharacter, collectCharacter, loadCharacter }
}

export const fetchCharacter = (nickname: string) =>
  createCharacterClient(useNuxtApp().$api).fetchCharacter(nickname)
export const collectCharacter = (
  nickname: string,
  onSnapshot?: (run: CollectionRun) => void,
) =>
  createCharacterClient(useNuxtApp().$api).collectCharacter(
    nickname,
    onSnapshot,
  )
export const loadCharacter = (nickname: string) =>
  createCharacterClient(useNuxtApp().$api).loadCharacter(nickname)
export const useCharacter = (nickname: string) => {
  const client = createCharacterClient(useNuxtApp().$api)
  return useLazyAsyncData(`character:${nickname}`, () =>
    client.loadCharacter(nickname),
  )
}
