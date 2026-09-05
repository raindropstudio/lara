import { expect, it } from 'vitest'
import { imageCode } from './read.js'

it('item/icon 경로에서 icon 문자열 대신 장비 코드를 추출한다', () => {
  expect(
    imageCode(
      'https://open.api.nexon.com/static/maplestory/item/icon/EQUIPMENT',
    ),
  ).toBe('EQUIPMENT')
  expect(
    imageCode(
      'https://open.api.nexon.com/static/maplestory/character/abc/item/123/avatar.png',
    ),
  ).toBe('123')
  const url =
    'https://open.api.nexon.com/static/maplestory/character/look/appearance?wmotion=W00'
  expect(imageCode(url)).toBe(url)
})
