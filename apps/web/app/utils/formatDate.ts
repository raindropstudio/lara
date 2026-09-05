export const formatDateTime = (dateString: string) => {
  const date = new Date(dateString)
  const year = String(date.getFullYear()).slice(-2) // 연도의 뒤 두 자리만 가져오기
  const month = String(date.getMonth() + 1).padStart(2, '0') // 월은 0부터 시작하므로 1 더하기
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}.${month}.${day} ${hours}:${minutes}`
}

export const formatKoreanDateTime = (dateString: string) => {
  const date = new Date(dateString)
  const year = String(date.getFullYear())
  const month = String(date.getMonth() + 1).padStart(2, '0') // 월은 0부터 시작하므로 1 더하기
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}년 ${month}월 ${day}일 ${hours}시 ${minutes}분`
}
