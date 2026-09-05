import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { testCharacter } from '../../test/character'
import { useInspection } from './useInspection'

const client = vi.hoisted(() => ({
  loadCharacter: vi.fn(),
  collectCharacter: vi.fn(),
}))
vi.mock('./useLara', () => ({ createCharacterClient: () => client }))

beforeEach(() => {
  vi.stubGlobal('ref', ref)
  vi.stubGlobal('useNuxtApp', () => ({ $api: {} }))
  vi.stubGlobal('onDeactivated', vi.fn())
  vi.stubGlobal('onBeforeUnmount', vi.fn())
  client.loadCharacter
    .mockReset()
    .mockImplementation(async (name: string) => testCharacter(name))
  client.collectCharacter
    .mockReset()
    .mockImplementation(async (name: string) => testCharacter(name))
})
afterEach(() => vi.unstubAllGlobals())
const settle = async () => {
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
}

describe('군장검사 상태', () => {
  it('조회 실패를 캐릭터별로 격리하고 중복·초과 입력은 요청하지 않는다', async () => {
    client.loadCharacter.mockImplementation(async (name: string) => {
      if (name === '실패') throw new Error('조회 실패')
      return testCharacter(name)
    })
    const inspection = useInspection()
    expect(inspection.add('라라, 실패')).toBe(true)
    await settle()
    expect(inspection.entries.value[0]?.character?.nickname).toBe('라라')
    expect(inspection.entries.value[1]?.error).toBe('조회 실패')
    expect(inspection.entries.value.every((entry) => !entry.pending)).toBe(true)
    expect(inspection.add('라라')).toBe(false)
    expect(inspection.add('하나 둘 셋 넷 다섯')).toBe(false)
    expect(client.loadCharacter).toHaveBeenCalledTimes(2)
  })
  it('갱신 실패에도 이전 결과를 유지하고 순서 변경·제거를 반영한다', async () => {
    const inspection = useInspection()
    inspection.add('라라 비숍')
    await settle()
    client.collectCharacter.mockRejectedValue(new Error('갱신 실패'))
    await inspection.refresh('라라')
    expect(inspection.entries.value[0]?.character?.nickname).toBe('라라')
    expect(inspection.entries.value[0]?.error).toBe('갱신 실패')
    inspection.move('라라', 1)
    expect(inspection.entries.value.map((entry) => entry.nickname)).toEqual([
      '비숍',
      '라라',
    ])
    inspection.remove('라라')
    expect(inspection.entries.value).toHaveLength(1)
  })
  it('이전 날짜 자료는 먼저 표시하고 자동으로 갱신한다', async () => {
    client.loadCharacter.mockResolvedValue({
      ...testCharacter(),
      updatedAt: '2020-01-01T00:00:00.000Z',
      collectedAt: '2020-01-01T00:00:00.000Z',
    })
    const inspection = useInspection()
    inspection.add('라라')
    await settle()
    expect(client.collectCharacter).toHaveBeenCalledOnce()
    expect(inspection.entries.value[0]?.character?.updatedAt).not.toBe(
      '2020-01-01T00:00:00.000Z',
    )
  })
  it('삭제한 캐릭터의 요청을 취소하고 늦은 응답을 다시 넣지 않는다', async () => {
    let finish: ((value: ReturnType<typeof testCharacter>) => void) | undefined
    let signal: AbortSignal | undefined
    client.loadCharacter.mockImplementation(
      (_name: string, requestSignal: AbortSignal) => {
        signal = requestSignal
        return new Promise((resolve) => {
          finish = resolve
        })
      },
    )
    const inspection = useInspection()
    inspection.add('라라')
    inspection.remove('라라')
    expect(signal?.aborted).toBe(true)
    finish?.(testCharacter())
    await settle()
    expect(inspection.entries.value).toEqual([])
  })
})
