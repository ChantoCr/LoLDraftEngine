import { execFile } from 'node:child_process'
import path from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

export interface LcuProcessHint {
  name?: string
  executablePath?: string
  commandLine?: string
}

interface DiscoverLcuCandidateLockfilePathsFromProcessesInput {
  platform?: NodeJS.Platform
  runCommand?: (command: string, args: string[]) => Promise<string>
}

function normalizeProcessHint(payload: unknown): LcuProcessHint | undefined {
  if (!payload || typeof payload !== 'object') {
    return undefined
  }

  const candidate = payload as Record<string, unknown>

  return {
    name: typeof candidate.name === 'string' ? candidate.name : typeof candidate.Name === 'string' ? candidate.Name : undefined,
    executablePath:
      typeof candidate.executablePath === 'string'
        ? candidate.executablePath
        : typeof candidate.ExecutablePath === 'string'
          ? candidate.ExecutablePath
          : undefined,
    commandLine:
      typeof candidate.commandLine === 'string'
        ? candidate.commandLine
        : typeof candidate.CommandLine === 'string'
          ? candidate.CommandLine
          : undefined,
  }
}

function normalizeProcessHints(payload: unknown): LcuProcessHint[] {
  if (Array.isArray(payload)) {
    return payload.flatMap((entry) => {
      const normalized = normalizeProcessHint(entry)
      return normalized ? [normalized] : []
    })
  }

  const normalized = normalizeProcessHint(payload)
  return normalized ? [normalized] : []
}

function extractInstallDirectoriesFromCommandLine(commandLine?: string) {
  if (!commandLine) {
    return []
  }

  const matches = [
    ...commandLine.matchAll(/--install-directory=\"([^\"]+)\"/g),
    ...commandLine.matchAll(/--install-directory=([^\s]+)/g),
  ]

  return [...new Set(
    matches
      .map((match) => match[1]?.replace(/^\"|\"$/g, ''))
      .filter((value): value is string => Boolean(value)),
  )]
}

export function buildCandidateLockfilePathsFromProcessHints(processHints: LcuProcessHint[]) {
  const candidatePaths = new Set<string>()

  for (const processHint of processHints) {
    if (processHint.executablePath) {
      candidatePaths.add(path.join(path.dirname(processHint.executablePath), 'lockfile'))
    }

    for (const installDirectory of extractInstallDirectoriesFromCommandLine(processHint.commandLine)) {
      candidatePaths.add(path.join(installDirectory, 'lockfile'))
    }
  }

  return [...candidatePaths]
}

async function defaultRunCommand(command: string, args: string[]) {
  const { stdout } = await execFileAsync(command, args, { windowsHide: true })
  return stdout
}

async function discoverWindowsProcessHints(runCommand: (command: string, args: string[]) => Promise<string>) {
  const stdout = await runCommand('powershell', [
    '-NoProfile',
    '-Command',
    "Get-CimInstance Win32_Process | Where-Object { $_.Name -match 'LeagueClient|League of Legends' } | Select-Object Name,ExecutablePath,CommandLine | ConvertTo-Json -Compress",
  ])

  const trimmed = stdout.trim()
  if (!trimmed) {
    return []
  }

  return normalizeProcessHints(JSON.parse(trimmed) as unknown)
}

async function discoverPosixProcessHints(runCommand: (command: string, args: string[]) => Promise<string>) {
  const stdout = await runCommand('ps', ['-ax', '-o', 'command='])

  return stdout
    .split(/\r?\n/g)
    .map((line) => line.trim())
    .filter((line) => line.includes('LeagueClient') || line.includes('League of Legends'))
    .map((line) => ({ commandLine: line }))
}

export async function discoverLcuCandidateLockfilePathsFromProcesses({
  platform = process.platform,
  runCommand = defaultRunCommand,
}: DiscoverLcuCandidateLockfilePathsFromProcessesInput = {}) {
  try {
    const processHints =
      platform === 'win32'
        ? await discoverWindowsProcessHints(runCommand)
        : platform === 'darwin' || platform === 'linux'
          ? await discoverPosixProcessHints(runCommand)
          : []

    return buildCandidateLockfilePathsFromProcessHints(processHints)
  } catch {
    return []
  }
}
