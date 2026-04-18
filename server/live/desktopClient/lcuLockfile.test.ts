import { describe, expect, it, vi } from 'vitest'
import {
  discoverLcuConnectionCredentials,
  discoverLcuLockfilePath,
  parseLcuLockfile,
} from '@server/live/desktopClient/lcuLockfile'

describe('lcuLockfile', () => {
  it('parses a League Client lockfile into typed connection credentials', () => {
    expect(parseLcuLockfile('LeagueClientUx:12345:2999:super-secret:https', 'C:/Riot Games/League/lockfile')).toEqual({
      processName: 'LeagueClientUx',
      processId: 12345,
      credentials: {
        host: '127.0.0.1',
        username: 'riot',
        port: 2999,
        password: 'super-secret',
        protocol: 'https',
      },
      lockfilePath: 'C:/Riot Games/League/lockfile',
    })
  })

  it('discovers the first existing lockfile path from env/candidate inputs', async () => {
    const pathExists = vi.fn().mockImplementation(async (filePath: string) => filePath === 'D:/League/lockfile')

    await expect(
      discoverLcuLockfilePath({
        env: {
          LCU_LOCKFILE_PATH: 'D:/League/lockfile',
        } as NodeJS.ProcessEnv,
        pathExists,
      }),
    ).resolves.toBe('D:/League/lockfile')
  })

  it('loads and parses credentials from a discovered lockfile', async () => {
    const readTextFile = vi.fn().mockResolvedValue('LeagueClientUx:54321:3443:pw:http')

    await expect(
      discoverLcuConnectionCredentials({
        lockfilePath: 'C:/Riot Games/League/lockfile',
        pathExists: vi.fn().mockResolvedValue(true),
        readTextFile,
      }),
    ).resolves.toMatchObject({
      processName: 'LeagueClientUx',
      processId: 54321,
      credentials: {
        port: 3443,
        password: 'pw',
        protocol: 'http',
      },
    })
  })
})
