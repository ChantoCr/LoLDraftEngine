import { describe, expect, it, vi } from 'vitest'
import { createRiotApiClient } from '@server/live/riot/client'

describe('createRiotApiClient', () => {
  it('recognizes a player through Riot account, summoner, and active-game lookups with region-aware routing', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ puuid: 'puuid-1', gameName: 'Tester', tagLine: 'LAN' }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ id: 'summoner-1', puuid: 'puuid-1', summonerLevel: 100, profileIconId: 1 }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ gameId: 1, gameMode: 'CLASSIC', gameType: 'MATCHED_GAME' }) })
    const client = createRiotApiClient({ apiKey: 'riot-key', fetcher })

    const recognized = await client.recognizePlayerByRiotId({ gameName: 'Tester', tagLine: 'LAN', region: 'LAN' })

    expect(fetcher).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/Tester/LAN'),
      expect.anything(),
    )
    expect(fetcher).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('https://la1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/puuid-1'),
      expect.anything(),
    )
    expect(recognized.region).toBe('LAN')
    expect(recognized.activeGame?.gameMode).toBe('CLASSIC')
  })
})
