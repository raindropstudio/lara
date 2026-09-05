#!/usr/bin/env node

import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

import { createFetchNexonClient } from '@lara/nexon-client'

import { loadFixturePlan } from './plan.js'
import { recordFixturePlan } from './record.js'
import { findFixtureManifests, verifyFixtureManifest } from './verify.js'

const defaultFixtureRoot = fileURLToPath(
  new URL('../../../fixtures/nexon', import.meta.url),
)
const invocationDirectory = process.env.INIT_CWD ?? process.cwd()
const invocationPath = (value: string): string =>
  resolve(invocationDirectory, value)

const knownSecrets = (): string[] =>
  [process.env.NEXON_API_KEY, process.env.NXAPI_KEY].filter(
    (value): value is string => typeof value === 'string' && value.length > 0,
  )

const flagValue = (args: string[], flag: string): string | undefined => {
  const index = args.indexOf(flag)
  if (index < 0) return undefined
  const value = args[index + 1]
  if (!value || value.startsWith('--')) {
    throw new TypeError(`${flag} 값이 필요합니다.`)
  }
  return value
}

const record = async (args: string[]): Promise<void> => {
  const planPath = flagValue(args, '--plan')
  const outputPath = flagValue(args, '--out')
  if (!planPath || !outputPath) {
    throw new TypeError('record에는 --plan과 --out이 필요합니다.')
  }
  const concurrencyValue = flagValue(args, '--concurrency')
  const concurrency = concurrencyValue
    ? Number.parseInt(concurrencyValue, 10)
    : undefined
  const apiKey = process.env.NEXON_API_KEY ?? process.env.NXAPI_KEY
  if (!apiKey) {
    throw new Error('NEXON_API_KEY 환경변수가 필요합니다.')
  }

  const plan = await loadFixturePlan(invocationPath(planPath))
  const client = createFetchNexonClient({ apiKey })
  const options = {
    knownSecrets: [apiKey],
    ...(concurrency === undefined ? {} : { concurrency }),
  }
  const result = await recordFixturePlan(
    plan,
    invocationPath(outputPath),
    client,
    options,
  )
  process.stdout.write(
    `기록 완료: ${result.responseCount}개 응답, ${result.manifestPath}\n`,
  )
}

const verify = async (args: string[]): Promise<void> => {
  const targets = args.filter((arg) => !arg.startsWith('--'))
  const roots =
    targets.length > 0 ? targets.map(invocationPath) : [defaultFixtureRoot]
  const manifests = (
    await Promise.all(roots.map((path) => findFixtureManifests(path)))
  ).flat()
  if (manifests.length === 0) {
    throw new Error('검증할 manifest.json이 없습니다.')
  }

  let failed = false
  for (const manifestPath of manifests) {
    const result = await verifyFixtureManifest(manifestPath, knownSecrets())
    if (result.valid) {
      process.stdout.write(
        `검증 성공: ${manifestPath} (${result.checkedBodies} bodies)\n`,
      )
      continue
    }
    failed = true
    process.stderr.write(`검증 실패: ${manifestPath}\n`)
    for (const issue of result.issues) {
      process.stderr.write(`- ${issue}\n`)
    }
  }
  if (failed) process.exitCode = 1
}

const usage = (): string =>
  [
    '사용법:',
    '  nexon-fixtures record --plan <plan.json> --out <directory> [--concurrency 1..8]',
    '  nexon-fixtures verify [manifest-or-directory ...]',
  ].join('\n')

const main = async (): Promise<void> => {
  const [command, ...args] = process.argv.slice(2)
  if (command === 'record') return record(args)
  if (command === 'verify') return verify(args)
  process.stdout.write(`${usage()}\n`)
  if (command !== undefined) process.exitCode = 1
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  process.stderr.write(`${message}\n`)
  process.exitCode = 1
})
