import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import {
  buildCandidateLockfilePathsFromProcessHints,
  discoverLcuCandidateLockfilePathsFromProcesses,
} from '@server/live/desktopClient/lcuProcessDiscovery'

describe('lcuProcessDiscovery', () => {
  it('builds candidate lockfile paths from process executable paths and install-directory flags', () => {
    expect(
      buildCandidateLockfilePathsFromProcessHints([
        {
          executablePath: 'C:/Riot Games/League of Legends/LeagueClientUx.exe',
        },
        {
          commandLine: 'LeagueClientUx.exe --install-directory="D:/Games/League"',
        },
      ]),
    ).toEqual([
      path.join('C:/Riot Games/League of Legends', 'lockfile'),
      path.join('D:/Games/League', 'lockfile'),
    ])
  })

  it('discovers process-derived candidate lockfile paths on Windows', async () => {
    const runCommand = vi.fn().mockResolvedValue(
      JSON.stringify([
        {
          Name: 'LeagueClientUx.exe',
          ExecutablePath: 'C:/Riot Games/League of Legends/LeagueClientUx.exe',
          CommandLine: 'LeagueClientUx.exe --install-directory="C:/Riot Games/League of Legends"',
        },
      ]),
    )

    const candidates = await discoverLcuCandidateLockfilePathsFromProcesses({
      platform: 'win32',
      runCommand,
    })

    expect(candidates).toContain(path.join('C:/Riot Games/League of Legends', 'lockfile'))
  })
})
