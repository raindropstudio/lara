import type { ParseContext } from './result.js'

export type UnknownRecord = Record<string, unknown>

export const readJson = (body: Uint8Array | string, context: ParseContext) => {
  try {
    const text =
      typeof body === 'string' ? body : new TextDecoder().decode(body)
    return JSON.parse(text) as unknown
  } catch {
    context.issue('$', 'invalid_json', 'JSON 본문을 읽을 수 없습니다.')
    return undefined
  }
}

export const record = (
  value: unknown,
  path: string,
  context: ParseContext,
): UnknownRecord | undefined => {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return value as UnknownRecord
  }

  context.issue(path, 'invalid_type', '객체가 필요합니다.', value)
  return undefined
}

export const array = (
  value: unknown,
  path: string,
  context: ParseContext,
  required = true,
) => {
  if (Array.isArray(value)) return value
  if (!required && (value === null || value === undefined)) return []
  context.issue(path, 'invalid_type', '배열이 필요합니다.', value)
  return []
}

export const text = (
  value: unknown,
  path: string,
  context: ParseContext,
  required = true,
) => {
  if (typeof value === 'string') return value
  if (!required && (value === null || value === undefined)) return undefined
  context.issue(
    path,
    required ? 'missing_required' : 'invalid_type',
    '문자열이 필요합니다.',
    value,
  )
  return undefined
}

export const number = (
  value: unknown,
  path: string,
  context: ParseContext,
  required = true,
) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  if (!required && (value === null || value === undefined || value === '')) {
    return undefined
  }
  context.issue(
    path,
    required ? 'missing_required' : 'invalid_value',
    '유효한 숫자가 필요합니다.',
    value,
  )
  return undefined
}

export const integer = (
  value: unknown,
  path: string,
  context: ParseContext,
  required = true,
) => {
  const parsed = number(value, path, context, required)
  if (parsed === undefined) return undefined
  if (Number.isInteger(parsed)) return parsed
  context.issue(path, 'invalid_value', '정수가 필요합니다.', value)
  return undefined
}

export const booleanFlag = (
  value: unknown,
  path: string,
  context: ParseContext,
) => {
  if (typeof value === 'boolean') return value
  if (value === 'true' || value === '1') return true
  if (value === 'false' || value === '0') return false
  context.issue(path, 'invalid_value', 'boolean flag가 필요합니다.', value)
  return undefined
}

export const imageCode = (value: unknown) => {
  if (typeof value !== 'string') return undefined
  const match = /\/item\/([^/?]+)/.exec(value)
  return match?.[1] ?? value
}

export const isoDate = (
  value: unknown,
  path: string,
  context: ParseContext,
) => {
  if (value === null || value === undefined || value === '') return undefined
  if (value === 'expired') return '1999-01-01T00:00:00.000Z'
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    context.issue(path, 'invalid_value', '유효한 날짜가 필요합니다.', value)
    return undefined
  }
  return new Date(value).toISOString()
}
