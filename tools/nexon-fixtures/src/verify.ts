import { createHash } from 'node:crypto'
import { readdir, readFile, realpath, stat } from 'node:fs/promises'
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path'

import {
  FixtureManifestError,
  loadFixtureManifest,
  type FixtureManifest,
} from './manifest.js'

export const sha256 = (body: Uint8Array): string =>
  createHash('sha256').update(body).digest('hex')

const credentialPropertyPattern =
  /["']?(?:x-nxopen-api-key|authorization|proxy-authorization|cookie|set-cookie|api[_-]?key|access[_-]?token|refresh[_-]?token)["']?\s*[:=]/iu

export const scanSecrets = (
  body: Uint8Array | string,
  knownSecrets: readonly string[] = [],
): string[] => {
  const text =
    typeof body === 'string' ? body : new TextDecoder('utf-8').decode(body)
  const issues: string[] = []
  if (credentialPropertyPattern.test(text)) {
    issues.push('인증 header 또는 credential key가 포함돼 있습니다.')
  }
  for (const secret of knownSecrets) {
    if (secret.length >= 8 && text.includes(secret)) {
      issues.push('현재 환경의 secret 값이 포함돼 있습니다.')
      break
    }
  }
  return issues
}

const isInside = (parent: string, child: string): boolean => {
  const path = relative(parent, child)
  return (
    path === '' ||
    (!path.startsWith(`..${sep}`) && path !== '..' && !isAbsolute(path))
  )
}

const listFiles = async (directory: string): Promise<string[]> => {
  let entries
  try {
    entries = await readdir(directory, { withFileTypes: true })
  } catch (error: unknown) {
    const code =
      typeof error === 'object' && error !== null
        ? Reflect.get(error, 'code')
        : undefined
    if (code === 'ENOENT') return []
    throw error
  }
  const files: string[] = []
  for (const entry of entries) {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await listFiles(path)))
    else if (entry.isFile()) files.push(path)
  }
  return files
}

export interface FixtureVerificationResult {
  manifestPath: string
  valid: boolean
  checkedBodies: number
  issues: string[]
  manifest?: FixtureManifest
}

export const verifyFixtureManifest = async (
  manifestPath: string,
  knownSecrets: readonly string[] = [],
): Promise<FixtureVerificationResult> => {
  const issues: string[] = []
  let manifest: FixtureManifest
  let manifestSource: string
  try {
    manifestSource = await readFile(manifestPath, 'utf8')
    issues.push(
      ...scanSecrets(manifestSource, knownSecrets).map(
        (issue) => `manifest: ${issue}`,
      ),
    )
    manifest = await loadFixtureManifest(manifestPath)
  } catch (error: unknown) {
    if (error instanceof FixtureManifestError) issues.push(...error.issues)
    else issues.push(error instanceof Error ? error.message : String(error))
    return {
      manifestPath,
      valid: false,
      checkedBodies: 0,
      issues,
    }
  }

  const root = await realpath(dirname(manifestPath))
  const referencedBodies = new Set<string>()
  let checkedBodies = 0

  for (const fixtureCase of manifest.cases) {
    for (const response of fixtureCase.responses) {
      const label = `${fixtureCase.id}/${response.responseId}`
      const candidate = resolve(root, response.bodyPath)
      if (!isInside(root, candidate)) {
        issues.push(`${label}: body 경로가 fixture root를 벗어납니다.`)
        continue
      }

      try {
        const metadata = await stat(candidate)
        if (!metadata.isFile()) {
          issues.push(`${label}: body 경로가 파일이 아닙니다.`)
          continue
        }
        const actualPath = await realpath(candidate)
        if (!isInside(root, actualPath)) {
          issues.push(`${label}: symlink가 fixture root를 벗어납니다.`)
          continue
        }
        const body = await readFile(actualPath)
        const actualHash = sha256(body)
        if (actualHash !== response.sha256) {
          issues.push(`${label}: SHA-256이 일치하지 않습니다.`)
        }
        if (!response.bodyPath.endsWith(`/${response.sha256}.body`)) {
          issues.push(`${label}: body 파일명이 SHA-256과 다릅니다.`)
        }
        issues.push(
          ...scanSecrets(body, knownSecrets).map(
            (issue) => `${label}: ${issue}`,
          ),
        )
        referencedBodies.add(actualPath)
        checkedBodies += 1
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        issues.push(`${label}: body를 읽을 수 없습니다: ${message}`)
      }
    }
  }

  const recordingFiles = await listFiles(resolve(root, 'recordings'))
  for (const file of recordingFiles) {
    const actualPath = await realpath(file)
    if (!referencedBodies.has(actualPath)) {
      issues.push(`참조되지 않은 recording이 있습니다: ${relative(root, file)}`)
    }
  }

  return {
    manifestPath,
    valid: issues.length === 0,
    checkedBodies,
    issues,
    manifest,
  }
}

export const findFixtureManifests = async (path: string): Promise<string[]> => {
  const metadata = await stat(path)
  if (metadata.isFile()) return [path]
  const files = await listFiles(path)
  return files.filter((file) => file.endsWith(`${sep}manifest.json`)).sort()
}
