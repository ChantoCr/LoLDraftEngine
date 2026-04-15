import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

let hasLoadedProjectEnv = false

function stripWrappingQuotes(value: string) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }

  return value
}

function parseEnvFile(content: string) {
  const parsedEntries: Record<string, string> = {}

  for (const rawLine of content.split(/\r?\n/u)) {
    const line = rawLine.trim()

    if (!line || line.startsWith('#')) {
      continue
    }

    const separatorIndex = line.indexOf('=')

    if (separatorIndex === -1) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim()
    const value = stripWrappingQuotes(line.slice(separatorIndex + 1).trim())

    if (!key) {
      continue
    }

    parsedEntries[key] = value
  }

  return parsedEntries
}

export function loadProjectEnv() {
  if (hasLoadedProjectEnv) {
    return
  }

  hasLoadedProjectEnv = true

  const projectRoot = process.cwd()
  const lockedKeys = new Set(
    Object.entries(process.env)
      .filter(([, value]) => value !== undefined)
      .map(([key]) => key),
  )

  for (const relativePath of ['.env', '.env.local']) {
    const absolutePath = path.resolve(projectRoot, relativePath)

    if (!existsSync(absolutePath)) {
      continue
    }

    const parsedEntries = parseEnvFile(readFileSync(absolutePath, 'utf8'))

    for (const [key, value] of Object.entries(parsedEntries)) {
      if (lockedKeys.has(key)) {
        continue
      }

      process.env[key] = value
    }
  }
}
