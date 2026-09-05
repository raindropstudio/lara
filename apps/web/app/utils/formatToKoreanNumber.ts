export const formatToKoreanNumber = (number: number) => {
  const units = ['', '만', '억', '조', '경']
  const parts = []

  for (let i = 0; i < units.length; i++) {
    const part = number % 10000
    if (part > 0 || i === 0) {
      parts.unshift(part.toString() + units[i])
    }
    number = Math.floor(number / 10000)
    if (number === 0) break
  }

  return parts.join(' ')
}
