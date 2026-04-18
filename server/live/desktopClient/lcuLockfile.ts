import { access, readFile } from 'node:fs/promises'
import { constants as fsConstants } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import type { LcuConnectionCredentials } from '@server/live/desktopClient/lcuAdapter'
import { discoverLcuCandidateLockfilePathsFromProcesses } from '@server/live/desktopClient/lcuProcessDiscovery'

export interface LcuLockfileDescriptor {
  processName: string
  processId: number
  credentials: LcuConnectionCredentials
  lockfilePath: string
}

interface DiscoverLcuConnectionCredentialsInput {
  lockfilePath?: string
  env?: NodeJS.ProcessEnv
  readTextFile?: (filePath: string) => Promise<string>
  pathExists?: (filePath: string) => Promise<boolean>
  processLockfilePathDiscovery?: () => Promise<string[]>
}

async function defaultPathExists(filePath: string) {
  try {
    await access(filePath, fsConstants.F_OK)
    return true
  } catch {
    return false
  }
}

function getCandidateLockfilePaths(env: NodeJS.ProcessEnv = process.env) {
  const homeDirectory = os.homedir()
  const explicitCandidates = [env.LCU_LOCKFILE_PATH, env.LEAGUE_CLIENT_LOCKFILE_PATH].filter(Boolean) as string[]
  const installDirectoryCandidates = [env.LEAGUE_INSTALL_DIR, env.LEAGUE_OF_LEGENDS_INSTALL_DIR]
    .filter((installDirectory): installDirectory is string => typeof installDirectory === 'string' && installDirectory.length > 0)
    .map((installDirectory) => path.join(installDirectory, 'lockfile'))

  return [...new Set([
    ...explicitCandidates,
    ...installDirectoryCandidates,
    'C:/Riot Games/League of Legends/lockfile',
    'C:/Riot Games/League of Legends (TM)/lockfile',
    path.join(homeDirectory, 'Applications', 'League of Legends.app', 'Contents', 'LoL', 'lockfile'),
    '/Applications/League of Legends.app/Contents/LoL/lockfile',
  ])]
}

export function parseLcuLockfile(lockfileContent: string, lockfilePath = 'lockfile'): LcuLockfileDescriptor {
  const [processName, processId, port, password, protocol] = lockfileContent.trim().split(':')

  if (!processName || !processId || !port || !password || !protocol) {
    throw new Error(`Invalid LCU lockfile format at ${lockfilePath}.`)
  }

  const parsedProcessId = Number(processId)
  const parsedPort = Number(port)

  if (!Number.isInteger(parsedProcessId) || parsedProcessId <= 0) {
    throw new Error(`Invalid LCU process id in lockfile ${lockfilePath}.`)
  }

  if (!Number.isInteger(parsedPort) || parsedPort <= 0) {
    throw new Error(`Invalid LCU port in lockfile ${lockfilePath}.`)
  }

  if (protocol !== 'https' && protocol !== 'http') {
    throw new Error(`Invalid LCU protocol in lockfile ${lockfilePath}.`)
  }

  return {
    processName,
    processId: parsedProcessId,
    credentials: {
      host: '127.0.0.1',
      username: 'riot',
      port: parsedPort,
      password,
      protocol,
    },
    lockfilePath,
  }
}

export async function discoverLcuLockfilePath({
  lockfilePath,
  env = process.env,
  pathExists = defaultPathExists,
  processLockfilePathDiscovery = () => discoverLcuCandidateLockfilePathsFromProcesses(),
}: Omit<DiscoverLcuConnectionCredentialsInput, 'readTextFile'>) {
  const staticCandidates = lockfilePath ? [lockfilePath, ...getCandidateLockfilePaths(env)] : getCandidateLockfilePaths(env)
  const processCandidates = await processLockfilePathDiscovery()
  const candidates = [...new Set([...staticCandidates, ...processCandidates])]

  for (const candidatePath of candidates) {
    if (await pathExists(candidatePath)) {
      return candidatePath
    }
  }

  throw new Error(
    'Unable to find the League Client lockfile. Start the local LoL client or set LCU_LOCKFILE_PATH/LEAGUE_INSTALL_DIR explicitly.',
  )
}

export async function discoverLcuConnectionCredentials({
  lockfilePath,
  env = process.env,
  readTextFile = (filePath) => readFile(filePath, 'utf8'),
  pathExists = defaultPathExists,
  processLockfilePathDiscovery = () => discoverLcuCandidateLockfilePathsFromProcesses(),
}: DiscoverLcuConnectionCredentialsInput = {}): Promise<LcuLockfileDescriptor> {
  const resolvedLockfilePath = await discoverLcuLockfilePath({ lockfilePath, env, pathExists, processLockfilePathDiscovery })
  const lockfileContent = await readTextFile(resolvedLockfilePath)

  return parseLcuLockfile(lockfileContent, resolvedLockfilePath)
}
