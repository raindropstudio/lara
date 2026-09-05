import { expect, it } from 'vitest'
import { formatToKoreanNumber } from './formatToKoreanNumber'
it('빈 자리의 0을 덧붙이지 않고 만 단위로 표현한다', () => {
  expect(formatToKoreanNumber(85000000)).toBe('8500만')
  expect(formatToKoreanNumber(100000001)).toBe('1억 1')
  expect(formatToKoreanNumber(0)).toBe('0')
  expect(formatToKoreanNumber(-10000)).toBe('-1만')
  expect(formatToKoreanNumber(NaN)).toBe('—')
})
