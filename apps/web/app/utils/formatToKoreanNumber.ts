export const formatToKoreanNumber = (number: number) => {
  if (!Number.isFinite(number)) return '—'
  if (number === 0) return '0'
  const sign = number < 0 ? '-' : ''
  number = Math.floor(Math.abs(number))
  const units = ['', '만', '억', '조', '경']
  const parts = []

  for (let i = 0; i < units.length; i++) {
    const part = number % 10000
    if (part > 0) {
      parts.unshift(part.toString() + units[i])
    }
    number = Math.floor(number / 10000)
    if (number === 0) break
  }

  return sign + (parts.join(' ') || '0')
}
