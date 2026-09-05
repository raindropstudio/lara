export const PARSER_VERSION = 'character-v1'

export type ParseStatus = 'complete' | 'partial' | 'failed'

export type ParseIssueCode =
  | 'invalid_json'
  | 'invalid_type'
  | 'invalid_value'
  | 'missing_required'
  | 'unknown_value'

export type ParseIssue = {
  path: string
  code: ParseIssueCode
  message: string
  receivedType?: string
}

export type ParseResult<T> = {
  status: ParseStatus
  value?: T
  issues: ParseIssue[]
  unknownPaths: string[]
  parserVersion: typeof PARSER_VERSION
}

export class ParseContext {
  readonly issues: ParseIssue[] = []
  readonly unknownPaths = new Set<string>()

  issue(
    path: string,
    code: ParseIssueCode,
    message: string,
    received?: unknown,
  ) {
    const receivedType = received === null ? 'null' : typeof received
    this.issues.push({ path, code, message, receivedType })
  }

  unknown(path: string, message: string, received?: unknown) {
    this.unknownPaths.add(path)
    this.issue(path, 'unknown_value', message, received)
  }

  result<T>(value: T | undefined): ParseResult<T> {
    if (value === undefined) {
      return {
        status: 'failed',
        issues: this.issues,
        unknownPaths: [...this.unknownPaths],
        parserVersion: PARSER_VERSION,
      }
    }

    return {
      status: this.issues.length === 0 ? 'complete' : 'partial',
      value,
      issues: this.issues,
      unknownPaths: [...this.unknownPaths],
      parserVersion: PARSER_VERSION,
    }
  }

  failed<T>(): ParseResult<T> {
    return {
      status: 'failed',
      issues: this.issues,
      unknownPaths: [...this.unknownPaths],
      parserVersion: PARSER_VERSION,
    }
  }
}
