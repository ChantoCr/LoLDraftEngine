import { describe, expect, it, vi } from 'vitest'
import { createRiotBackendLiveDraftAdapter } from '@server/live/adapters/riot'

describe('createRiotBackendLiveDraftAdapter', () => {
  it('polls Riot active-game state and emits a mapped draft snapshot when available', async () => {
    const emittedIntervals: Array<() => void> = []
    const adapter = createRiotBackendLiveDraftAdapter({
      riotApiKey: 'riot-key',
      pollIntervalMs: 1_000,
      setIntervalFn: ((callback: () => void) => {
        emittedIntervals.push(callback)
        return 1 as unknown as ReturnType<typeof setInterval>
      }) as typeof setInterval,
      clearIntervalFn: vi.fn() as typeof clearInterval,
      loadChampionCatalog: vi.fn().mockResolvedValue({
        resolvedPatchVersion: '16.8.1',
        championCatalog: [
          { championId: 'aatrox', riotChampionId: 266 },
          { championId: 'thresh', riotChampionId: 412 },
          { championId: 'garen', riotChampionId: 86 },
        ],
      }),
      clientFactory: () => ({
        recognizePlayerByRiotId: vi.fn().mockResolvedValue({
          account: { puuid: 'puuid-1', gameName: 'Tester', tagLine: 'LAN' },
          summoner: { id: 'summoner-1', puuid: 'puuid-1', summonerLevel: 1, profileIconId: 1 },
          region: 'LAN',
          lookupDebug: {
            source: 'RIOT_API',
            accountLookup: { status: 'success' },
            summonerLookupByPuuid: { status: 'success' },
            summonerLookupByAccountFallback: { status: 'not-needed' },
            summonerLookupByNameFallback: { status: 'not-needed' },
            encryptedSummonerId: { status: 'success' },
            activeGameLookup: { status: 'success' },
          },
          activeGame: {
            gameId: 999,
            gameMode: 'CLASSIC',
            gameType: 'MATCHED_GAME',
            participants: [
              { teamId: 100, championId: 412, puuid: 'puuid-1' },
              { teamId: 100, championId: 266, puuid: 'ally-top' },
              { teamId: 200, championId: 86, puuid: 'enemy-top' },
            ],
          },
        }),
      }),
    })
    const emitEvent = vi.fn()

    const unsubscribe = await adapter.subscribe(
      {
        id: 'riot-session-1',
        source: 'RIOT_API',
        player: { gameName: 'Tester', tagLine: 'LAN', region: 'LAN' },
        status: 'connected',
        createdAt: '2026-04-18T03:40:00.000Z',
        updatedAt: '2026-04-18T03:40:00.000Z',
      },
      emitEvent,
    )

    expect(emitEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'session-update',
        session: expect.objectContaining({
          status: 'connected',
          snapshotDebug: expect.objectContaining({
            source: 'RIOT_API',
            snapshotMapped: true,
          }),
          riotLookupDebug: expect.objectContaining({
            source: 'RIOT_API',
            accountLookup: expect.objectContaining({ status: 'success' }),
          }),
        }),
      }),
    )
    expect(emitEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'draft-state',
        draftState: expect.objectContaining({ patchVersion: '16.8.1' }),
      }),
    )
    expect(emittedIntervals).toHaveLength(1)

    unsubscribe()
  })

  it('normalizes fallback summoner-name 403 failures into a clearer connected Riot warning', async () => {
    const adapter = createRiotBackendLiveDraftAdapter({
      riotApiKey: 'riot-key',
      loadChampionCatalog: vi.fn().mockResolvedValue({
        resolvedPatchVersion: '16.8.1',
        championCatalog: [],
      }),
      clientFactory: () => ({
        recognizePlayerByRiotId: vi.fn().mockResolvedValue({
          account: { puuid: 'puuid-1', gameName: 'Suli', tagLine: 'LAN' },
          summoner: { puuid: 'puuid-1', summonerLevel: 1, profileIconId: 1 },
          region: 'LAN',
          activeGame: null,
          activeGameWarning:
            'Riot recognized the player profile, but fallback summoner-name lookup for Suli failed (Riot API request failed: 403 Forbidden - Forbidden). Active-game detection was skipped.',
          lookupDebug: {
            source: 'RIOT_API',
            accountLookup: { status: 'success' },
            summonerLookupByPuuid: { status: 'success' },
            summonerLookupByAccountFallback: { status: 'skipped' },
            summonerLookupByNameFallback: {
              status: 'failed',
              details: 'Fallback summoner-name lookup for Suli failed: Riot API request failed: 403 Forbidden - Forbidden',
            },
            encryptedSummonerId: { status: 'failed' },
            activeGameLookup: { status: 'skipped' },
          },
        }),
      }),
    })

    const recognizedSession = await adapter.recognizePlayer({ gameName: 'Suli', tagLine: 'LAN', region: 'LAN' })

    expect(recognizedSession).toMatchObject({
      status: 'connected',
      message:
        'Player recognized through americas/la1. Riot recognized the player profile, but Riot blocked the fallback summoner-name spectator recovery step (403 Forbidden). Active-game detection was skipped.',
      snapshotDebug: {
        source: 'RIOT_API',
        snapshotMapped: false,
        lastMappingFailureReason:
          'Riot recognized the player profile, but Riot blocked the fallback summoner-name spectator recovery step (403 Forbidden). Active-game detection was skipped.',
      },
    })
  })
})
