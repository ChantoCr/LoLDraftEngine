import { describe, expect, it, vi } from 'vitest'
import { resolveRiotChampionPool } from '@server/playerPool/riot'

describe('resolveRiotChampionPool', () => {
  it('builds a role-aware personal pool from Riot account and champion mastery data', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ puuid: 'puuid-1', gameName: 'Tester', tagLine: 'LAN' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 'encrypted-summoner-1', puuid: 'puuid-1', summonerLevel: 400, profileIconId: 1 }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => '',
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [
          { championId: 412, championLevel: 7, championPoints: 250000 },
          { championId: 497, championLevel: 6, championPoints: 180000 },
          { championId: 222, championLevel: 7, championPoints: 220000 },
          { championId: 89, championLevel: 5, championPoints: 90000 },
        ],
      } as Response)

    const pool = await resolveRiotChampionPool({
      identity: {
        gameName: 'Tester',
        tagLine: 'LAN',
        region: 'LAN',
      },
      role: 'SUPPORT',
      patchVersion: '16.8.1',
      apiKey: 'riot-key',
      fetcher,
      loadChampionCatalog: vi.fn().mockResolvedValue({
        resolvedPatchVersion: '16.8.1',
        championCatalog: [
          { championId: 'thresh', riotChampionId: 412, recommendedRoles: ['SUPPORT'] },
          { championId: 'rakan', riotChampionId: 497, recommendedRoles: ['SUPPORT'] },
          { championId: 'jinx', riotChampionId: 222, recommendedRoles: ['ADC'] },
          { championId: 'leona', riotChampionId: 89, recommendedRoles: ['SUPPORT'] },
        ],
      }),
    })

    expect(pool).toMatchObject({
      playerLabel: 'Tester#LAN · SUPPORT pool',
      role: 'SUPPORT',
      source: 'RIOT_API',
    })
    expect(pool.entries.map((entry) => entry.championId)).toEqual(['thresh', 'rakan', 'leona'])
    expect(pool.entries[0]).toMatchObject({ championId: 'thresh', tier: 'MAIN' })
    expect(pool.entries[1]).toMatchObject({ championId: 'rakan', tier: 'COMFORT' })
    expect(pool.entries[0]!.masteryConfidence).toBeGreaterThan(pool.entries[1]!.masteryConfidence)
  })

  it('falls back to the active-game participant summoner id when the PUUID-based summoner profile omits it', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ puuid: 'puuid-2', gameName: 'Tester', tagLine: 'LAN' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ puuid: 'puuid-2', summonerLevel: 400, profileIconId: 1 }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          gameId: 1,
          gameMode: 'CLASSIC',
          gameType: 'MATCHED_GAME',
          participants: [
            {
              puuid: 'puuid-2',
              summonerId: 'encrypted-from-active-game',
              riotIdGameName: 'Tester',
              riotIdTagline: 'LAN',
              championId: 412,
              teamId: 100,
            },
          ],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ championId: 412, championLevel: 7, championPoints: 250000 }],
      } as Response)

    const pool = await resolveRiotChampionPool({
      identity: {
        gameName: 'Tester',
        tagLine: 'LAN',
        region: 'LAN',
      },
      role: 'SUPPORT',
      patchVersion: '16.8.1',
      apiKey: 'riot-key',
      fetcher,
      loadChampionCatalog: vi.fn().mockResolvedValue({
        resolvedPatchVersion: '16.8.1',
        championCatalog: [{ championId: 'thresh', riotChampionId: 412, recommendedRoles: ['SUPPORT'] }],
      }),
    })

    expect(pool.entries.map((entry) => entry.championId)).toEqual(['thresh'])
  })
})
