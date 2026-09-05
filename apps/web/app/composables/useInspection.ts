import { createCharacterClient } from './useLara'
import {
  INSPECTION_LIMIT,
  parseInspectionNames,
  shouldRefreshInspection,
} from '~/utils/inspection'
import type { Character } from '~/types/character.type'
import type { CollectionRun } from '~/types/api.type'

export interface InspectionEntry {
  nickname: string
  character?: Character
  pending: boolean
  error?: string
  run?: CollectionRun
}

export const useInspection = () => {
  const client = createCharacterClient(useNuxtApp().$api)
  const entries = ref<InspectionEntry[]>([])
  const message = ref('')
  const requests = new Map<string, AbortController>()

  const refresh = async (nickname: string, force = true) => {
    const entry = entries.value.find((entry) => entry.nickname === nickname)
    if (!entry || requests.has(nickname)) return
    const controller = new AbortController()
    requests.set(nickname, controller)
    const signal = AbortSignal.any([
      controller.signal,
      AbortSignal.timeout(120_000),
    ])
    entry.pending = true
    entry.error = undefined
    entry.run = undefined
    try {
      entry.character = force
        ? await client.collectCharacter(
            nickname,
            (run) => {
              entry.run = run
            },
            signal,
          )
        : await client.loadCharacter(nickname, signal)
      if (
        !force &&
        shouldRefreshInspection(
          entry.character.collectedAt ?? entry.character.updatedAt,
        )
      ) {
        entry.character = await client.collectCharacter(
          nickname,
          (run) => {
            entry.run = run
          },
          signal,
        )
      }
    } catch (error) {
      if (!controller.signal.aborted)
        entry.error = signal.aborted
          ? '조회 시간이 초과되었습니다. 다시 시도해 주세요.'
          : error instanceof Error
            ? error.message
            : '캐릭터를 불러오지 못했습니다.'
    } finally {
      entry.pending = false
      if (requests.get(nickname) === controller) requests.delete(nickname)
    }
  }

  const add = (input: string) => {
    const names = parseInspectionNames(input)
    if (!names.length) {
      message.value = '캐릭터 이름을 입력해 주세요.'
      return false
    }
    const added = names.filter(
      (name) => !entries.value.some((entry) => entry.nickname === name),
    )
    if (!added.length) {
      message.value = '이미 비교 중인 캐릭터입니다.'
      return false
    }
    if (
      added.some(
        (name) => name.length > 12 || !/^[가-힣a-zA-Z0-9]+$/.test(name),
      )
    ) {
      message.value = '캐릭터 이름은 한글·영문·숫자 12자 이내로 입력해 주세요.'
      return false
    }
    if (entries.value.length + added.length > INSPECTION_LIMIT) {
      message.value = `최대 ${INSPECTION_LIMIT}명까지 비교할 수 있습니다.`
      return false
    }
    message.value = ''
    for (const nickname of added) {
      entries.value.push({ nickname, pending: true })
      void refresh(nickname, false)
    }
    return true
  }

  const remove = (nickname: string) => {
    requests.get(nickname)?.abort()
    requests.delete(nickname)
    entries.value = entries.value.filter((entry) => entry.nickname !== nickname)
    message.value = ''
  }
  const move = (nickname: string, offset: number) => {
    const index = entries.value.findIndex(
      (entry) => entry.nickname === nickname,
    )
    const next = index + offset
    if (index < 0 || next < 0 || next >= entries.value.length) return
    const [entry] = entries.value.splice(index, 1)
    if (entry) entries.value.splice(next, 0, entry)
  }
  const stop = () => {
    for (const request of requests.values()) request.abort()
    requests.clear()
  }
  onDeactivated(stop)
  onBeforeUnmount(stop)
  return { entries, message, add, refresh, remove, move }
}
