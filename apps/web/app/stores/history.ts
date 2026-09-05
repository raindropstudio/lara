interface CharacterInfo {
  nickname: string
  imageUrl: string
  level: number
  class: string
  guildName: string
  worldName: string
}

interface HistoryBase {
  query: string
  date: string
  count: number
}

type HistoryType = 'character'
export type Info = CharacterInfo

export type History = HistoryBase & { type: 'character'; info: CharacterInfo }

const MAX_ENTRIES = 100

export const useHistoryStore = defineStore(
  'history',
  () => {
    const history = ref<History[]>([])
    const favorite = ref<History[]>([])

    const addFavorite = (type: HistoryType, query: string) => {
      if (
        favorite.value.some(
          (item) => item.type === type && item.query === query.trim(),
        )
      )
        return
      const index = history.value.findIndex(
        (item) => item.type === type && item.query === query.trim(),
      )
      if (index !== -1 && history.value[index]) {
        // 즐겨찾기에 추가
        favorite.value.push({
          ...history.value[index],
          date: new Date().toISOString(),
        })

        // 기록에서 삭제
        history.value.splice(index, 1)
      }
    }

    const deleteFavorite = (type: HistoryType, query: string) => {
      const index = favorite.value.findIndex(
        (item) => item.type === type && item.query === query.trim(),
      )
      if (index !== -1 && favorite.value[index]) {
        // 기록에 추가
        history.value.unshift({
          type,
          query: query.trim(),
          date: new Date().toISOString(),
          count: favorite.value[index].count,
          info: favorite.value[index].info,
        })

        favorite.value.splice(index, 1)
      }
    }

    const addHistory = (type: HistoryType, query: string, info: Info) => {
      // 즐겨찾기에 있는 경우 업데이트
      const favIndex = favorite.value.findIndex(
        (item) => item.type === type && item.query === query.trim(),
      )
      if (favIndex !== -1 && favorite.value[favIndex]) {
        favorite.value[favIndex].count++
        favorite.value[favIndex].date = new Date().toISOString()
        favorite.value[favIndex].info = info

        return
      }

      const index = history.value.findIndex(
        (item) => item.type === type && item.query === query.trim(),
      )
      if (index !== -1 && history.value[index]) {
        history.value[index].count++
        history.value[index].date = new Date().toISOString()
        history.value[index].info = info

        // 최상단 이동
        const item = history.value[index]
        history.value.splice(index, 1)
        history.value.unshift(item)
      } else {
        history.value.unshift({
          type,
          query: query.trim(),
          date: new Date().toISOString(),
          count: 1,
          info,
        })

        if (history.value.length > MAX_ENTRIES) {
          history.value.pop()
        }
      }
    }

    const updateHistory = (type: HistoryType, query: string, info: Info) => {
      const index = history.value.findIndex(
        (item) => item.type === type && item.query === query.trim(),
      )
      if (index !== -1 && history.value[index]) {
        history.value[index].info = info
      }
    }

    const deleteHistory = (type: HistoryType, query: string) => {
      const index = history.value.findIndex(
        (item) => item.type === type && item.query === query.trim(),
      )
      if (index !== -1) {
        history.value.splice(index, 1)
      }
    }

    return {
      history,
      favorite,
      addFavorite,
      deleteFavorite,
      addHistory,
      updateHistory,
      deleteHistory,
    }
  },
  {
    persist: {
      storage: piniaPluginPersistedstate.localStorage(),
    },
  },
)
