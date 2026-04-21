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
            spectatorLookupPath: { status: 'success' },
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

  it('returns Riot lookup debug when account recognition fails because the API key is invalid or expired', async () => {
    const adapter = createRiotBackendLiveDraftAdapter({
      riotApiKey: 'expired-key',
      clientFactory: () => ({
        recognizePlayerByRiotId: vi.fn().mockRejectedValue(
          Object.assign(new Error('Riot account lookup failed: RIOT_API_KEY is invalid or expired.'), {
            lookupDebug: {
              source: 'RIOT_API',
              accountLookup: {
                status: 'failed',
                details:
                  'RIOT_API_KEY is invalid or expired. Generate a fresh Riot Developer Portal key, set it in `.env.local` as `RIOT_API_KEY=...`, restart `npm run server:dev`, and retry. The backend reads `.env` and `.env.local`, not `.env.example`. If you already updated `.env.local`, check whether a stale shell/system `RIOT_API_KEY` is overriding it.',
              },
              summonerLookupByPuuid: { status: 'skipped' },
              spectatorLookupPath: { status: 'skipped' },
              activeGameLookup: { status: 'skipped' },
            },
          }),
        ),
      }),
    })

    const recognizedSession = await adapter.recognizePlayer({ gameName: 'Tester', tagLine: 'LAN', region: 'LAN' })

    expect(recognizedSession).toMatchObject({
      status: 'error',
      message: 'Riot account lookup failed: RIOT_API_KEY is invalid or expired.',
      riotLookupDebug: {
        source: 'RIOT_API',
        accountLookup: { status: 'failed' },
      },
    })
  })

  it('stays connected and informational when the player is recognized but no active game is returned', async () => {
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
          lookupDebug: {
            source: 'RIOT_API',
            accountLookup: { status: 'success' },
            summonerLookupByPuuid: { status: 'success' },
            spectatorLookupPath: { status: 'success' },
            activeGameLookup: { status: 'not-found' },
          },
        }),
      }),
    })

    const recognizedSession = await adapter.recognizePlayer({ gameName: 'Suli', tagLine: 'LAN', region: 'LAN' })

    expect(recognizedSession).toMatchObject({
      status: 'connected',
      message: 'Player recognized through americas/la1, but no active game was detected.',
      snapshotDebug: {
        source: 'RIOT_API',
        snapshotMapped: false,
        lastMappingFailureReason: 'No active game snapshot is currently available from Riot spectator APIs.',
      },
    })
  })

  it('stays connected and reports a forbidden spectator outcome when active-game lookup returns 403', async () => {
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
            'Riot spectator-v5 active-game lookup returned 403 Forbidden for this player/session. Recognition still succeeded, but spectator roster access is unavailable here.',
          lookupDebug: {
            source: 'RIOT_API',
            accountLookup: { status: 'success' },
            summonerLookupByPuuid: { status: 'success' },
            spectatorLookupPath: { status: 'success' },
            activeGameLookup: { status: 'forbidden' },
          },
        }),
      }),
    })

    const recognizedSession = await adapter.recognizePlayer({ gameName: 'Suli', tagLine: 'LAN', region: 'LAN' })

    expect(recognizedSession).toMatchObject({
      status: 'connected',
      message:
        'Player recognized through americas/la1. Riot spectator-v5 active-game lookup returned 403 Forbidden for this player/session. Recognition still succeeded, but spectator roster access is unavailable here.',
      snapshotDebug: {
        source: 'RIOT_API',
        snapshotMapped: false,
        lastMappingFailureReason:
          'Riot spectator-v5 active-game lookup returned 403 Forbidden for this player/session. Recognition still succeeded, but spectator roster access is unavailable here.',
      },
      riotLookupDebug: {
        source: 'RIOT_API',
        activeGameLookup: { status: 'forbidden' },
      },
    })
  })
})
