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

  it('degrades gracefully when active-game lookup cannot resolve a valid encrypted summoner id', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ puuid: 'puuid-1', gameName: 'Tester', tagLine: 'LAN' }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ id: 'summoner-1', puuid: 'puuid-1', summonerLevel: 100, profileIconId: 1 }) })
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => 'Bad Request - Exception decrypting undefined',
      })
    const client = createRiotApiClient({ apiKey: 'riot-key', fetcher })

    await expect(
      client.recognizePlayerByRiotId({ gameName: 'Tester', tagLine: 'LAN', region: 'LAN' }),
    ).resolves.toMatchObject({
      region: 'LAN',
      activeGame: null,
      activeGameWarning: expect.stringContaining('Active-game detection was skipped'),
    })
  })

  it('falls back to accountId-based summoner lookup when the puuid lookup does not return an encrypted summoner id', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ puuid: 'puuid-1', gameName: 'Tester', tagLine: 'LAN' }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ puuid: 'puuid-1', accountId: 'account-1', summonerLevel: 100, profileIconId: 1 }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ id: 'summoner-1', puuid: 'puuid-1', accountId: 'account-1', summonerLevel: 100, profileIconId: 1 }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ gameId: 1, gameMode: 'CLASSIC', gameType: 'MATCHED_GAME' }) })
    const client = createRiotApiClient({ apiKey: 'riot-key', fetcher })

    const recognized = await client.recognizePlayerByRiotId({ gameName: 'Tester', tagLine: 'LAN', region: 'LAN' })

    expect(fetcher).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('https://la1.api.riotgames.com/lol/summoner/v4/summoners/by-account/account-1'),
      expect.anything(),
    )
    expect(recognized.activeGame?.gameMode).toBe('CLASSIC')
    expect(recognized.activeGameWarning).toBeUndefined()
    expect(recognized.lookupDebug.summonerLookupByAccountFallback).toMatchObject({ status: 'success' })
    expect(recognized.lookupDebug.summonerLookupByNameFallback).toMatchObject({ status: 'not-needed' })
  })

  it('uses the legacy summoner name from the summoner profile for by-name fallback when accountId recovery is unavailable', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ puuid: 'puuid-1', gameName: 'Tester', tagLine: 'LAN' }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ puuid: 'puuid-1', name: 'LegacyTester', summonerLevel: 100, profileIconId: 1 }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ id: 'summoner-1', puuid: 'puuid-1', name: 'LegacyTester', summonerLevel: 100, profileIconId: 1 }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ gameId: 1, gameMode: 'CLASSIC', gameType: 'MATCHED_GAME' }) })
    const client = createRiotApiClient({ apiKey: 'riot-key', fetcher })

    const recognized = await client.recognizePlayerByRiotId({ gameName: 'Tester', tagLine: 'LAN', region: 'LAN' })

    expect(fetcher).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('https://la1.api.riotgames.com/lol/summoner/v4/summoners/by-name/LegacyTester'),
      expect.anything(),
    )
    expect(recognized.lookupDebug.summonerLookupByAccountFallback).toMatchObject({ status: 'skipped' })
    expect(recognized.lookupDebug.summonerLookupByNameFallback).toMatchObject({ status: 'success' })
  })

  it('treats fallback summoner-name lookup failures as non-fatal spectator warnings', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ puuid: 'puuid-1', gameName: 'Moisox', tagLine: 'LAN' }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ puuid: 'puuid-1', name: 'Moisox', summonerLevel: 100, profileIconId: 1 }) })
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        text: async () => 'Forbidden',
      })
    const client = createRiotApiClient({ apiKey: 'riot-key', fetcher })

    const recognized = await client.recognizePlayerByRiotId({ gameName: 'Moisox', tagLine: 'LAN', region: 'LAN' })

    expect(recognized.activeGame).toBeNull()
    expect(recognized.activeGameWarning).toContain('fallback summoner-name lookup for Moisox failed')
    expect(recognized.lookupDebug.summonerLookupByAccountFallback).toMatchObject({ status: 'skipped' })
    expect(recognized.lookupDebug.summonerLookupByNameFallback).toMatchObject({ status: 'failed' })
    expect(recognized.lookupDebug.activeGameLookup).toMatchObject({ status: 'skipped' })
  })

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
