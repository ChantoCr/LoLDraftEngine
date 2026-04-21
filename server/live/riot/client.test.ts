import { describe, expect, it, vi } from 'vitest'
import { createRiotApiClient } from '@server/live/riot/client'

describe('createRiotApiClient', () => {
  it('surfaces Riot API error details for non-success responses', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      text: async () => JSON.stringify({ status: { message: 'Data not found - summonerName' } }),
    })
    const client = createRiotApiClient({ apiKey: 'riot-key', fetcher })

    await expect(
      client.recognizePlayerByRiotId({ gameName: 'Tester', tagLine: 'LAN', region: 'LAN' }),
    ).rejects.toThrow('Riot account lookup failed: Riot API request failed: 400 Bad Request - Data not found - summonerName')
  })

  it('turns Riot 401 Unknown apikey responses into a clear backend-credentials error', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: async () => JSON.stringify({ status: { message: 'Unknown apikey' } }),
    })
    const client = createRiotApiClient({ apiKey: 'expired-key', fetcher })

    await expect(client.recognizePlayerByRiotId({ gameName: 'Tester', tagLine: 'LAN', region: 'LAN' })).rejects.toThrow(
      'Riot account lookup failed: RIOT_API_KEY is invalid or expired.',
    )
  })

  it('uses the player puuid directly for spectator-v5 active-game lookup', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ puuid: 'puuid-1', gameName: 'Tester', tagLine: 'LAN' }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ puuid: 'puuid-1', summonerLevel: 100, profileIconId: 1 }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ gameId: 1, gameMode: 'CLASSIC', gameType: 'MATCHED_GAME' }) })
    const client = createRiotApiClient({ apiKey: 'riot-key', fetcher })

    const recognized = await client.recognizePlayerByRiotId({ gameName: 'Tester', tagLine: 'LAN', region: 'LAN' })

    expect(fetcher).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('https://la1.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/puuid-1'),
      expect.anything(),
    )
    expect(recognized.activeGame?.gameMode).toBe('CLASSIC')
    expect(recognized.activeGameWarning).toBeUndefined()
    expect(recognized.lookupDebug.spectatorLookupPath).toMatchObject({ status: 'success' })
  })

  it('keeps recognition successful when spectator-v5 returns 403 and classifies the active-game result as forbidden', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ puuid: 'puuid-1', gameName: 'Moisox', tagLine: 'LAN' }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ puuid: 'puuid-1', summonerLevel: 100, profileIconId: 1 }) })
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        text: async () => 'Forbidden',
      })
    const client = createRiotApiClient({ apiKey: 'riot-key', fetcher })

    const recognized = await client.recognizePlayerByRiotId({ gameName: 'Moisox', tagLine: 'LAN', region: 'LAN' })

    expect(recognized.activeGame).toBeNull()
    expect(recognized.activeGameWarning).toContain('403 Forbidden')
    expect(recognized.lookupDebug.activeGameLookup).toMatchObject({ status: 'forbidden' })
  })

  it('recognizes a player through Riot account, summoner, and active-game lookups with region-aware routing', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ puuid: 'puuid-1', gameName: 'Tester', tagLine: 'LAN' }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ puuid: 'puuid-1', summonerLevel: 100, profileIconId: 1 }) })
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
    expect(fetcher).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('https://la1.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/puuid-1'),
      expect.anything(),
    )
    expect(recognized.region).toBe('LAN')
    expect(recognized.activeGame?.gameMode).toBe('CLASSIC')
  })
})
