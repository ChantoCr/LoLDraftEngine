import { getServerConfig } from '@server/config/env'
import { loadDesktopChampionCatalog } from '@server/live/desktopClient/championCatalog'
import { mapRiotActiveGameToDraftStateWithDebug } from '@server/live/riot/activeGameMapper'
import { createRiotApiClient, type RiotApiClient, type RiotRecognizedPlayer } from '@server/live/riot/client'
import { getRiotRegionRouting } from '@server/live/riot/routing'
import type { BackendLiveDraftAdapter, RecognizedLiveSession } from '@server/live/types'
import type { SummonerIdentity } from '@/domain/live/types'

interface CreateRiotBackendLiveDraftAdapterInput {
  riotApiKey?: string
  clientFactory?: (apiKey: string) => RiotApiClient
  loadChampionCatalog?: typeof loadDesktopChampionCatalog
  pollIntervalMs?: number
  setIntervalFn?: typeof setInterval
  clearIntervalFn?: typeof clearInterval
}

function buildRiotActiveGameWarningSummary(recognizedPlayer: RiotRecognizedPlayer) {
  return recognizedPlayer.activeGameWarning
}

function createRiotSnapshotDebugState({
  recognizedPlayer,
  initialDraftState,
  snapshotFailureReason,
}: {
  recognizedPlayer: RiotRecognizedPlayer
  initialDraftState?: RecognizedLiveSession['initialDraftState']
  snapshotFailureReason?: string
}): RecognizedLiveSession['snapshotDebug'] {
  if (!recognizedPlayer.activeGame && !recognizedPlayer.activeGameWarning && !snapshotFailureReason) {
    return {
      source: 'RIOT_API',
      snapshotMapped: false,
      lastMappingFailureReason: 'No active game snapshot is currently available from Riot spectator APIs.',
    }
  }

  return {
    source: 'RIOT_API',
    snapshotMapped: Boolean(initialDraftState),
    lastSnapshotAt: recognizedPlayer.activeGame ? new Date().toISOString() : undefined,
    lastMappingFailureReason: initialDraftState
      ? undefined
      : snapshotFailureReason ??
        recognizedPlayer.activeGameWarning ??
        'The Riot active-game snapshot was not mapped into the draft board.',
  }
}

async function buildRiotRecognitionResult(
  identity: SummonerIdentity,
  {
    riotApiKey,
    clientFactory = (apiKey: string) => createRiotApiClient({ apiKey }),
    loadChampionCatalog = loadDesktopChampionCatalog,
  }: Pick<CreateRiotBackendLiveDraftAdapterInput, 'riotApiKey' | 'clientFactory' | 'loadChampionCatalog'>,
): Promise<{ recognizedSession: RecognizedLiveSession; recognizedPlayer?: RiotRecognizedPlayer }> {
  if (!riotApiKey) {
    return {
      recognizedSession: {
        status: 'error',
        message:
          'RIOT_API_KEY is not configured on the backend companion. Add a Riot API key to enable real region-aware player recognition.',
      },
    }
  }

  try {
    const client = clientFactory(riotApiKey)
    const recognizedPlayer = await client.recognizePlayerByRiotId({
      gameName: identity.gameName,
      tagLine: identity.tagLine,
      region: identity.region,
    })
    const routing = getRiotRegionRouting(identity.region)
    const { resolvedPatchVersion, championCatalog } = await loadChampionCatalog('latest').catch(() => ({
      resolvedPatchVersion: 'latest',
      championCatalog: [],
    }))
    const activeGameMappingResult =
      recognizedPlayer.activeGame && championCatalog.length > 0
        ? mapRiotActiveGameToDraftStateWithDebug({
            player: recognizedPlayer,
            championCatalog,
            patchVersion: resolvedPatchVersion,
          })
        : undefined
    const initialDraftState = activeGameMappingResult?.draftState
    const normalizedActiveGameWarning = buildRiotActiveGameWarningSummary(recognizedPlayer)
    const snapshotFailureReason = recognizedPlayer.activeGame
      ? championCatalog.length === 0
        ? 'Champion catalog loading failed, so the Riot live-game roster could not be mapped into the draft board.'
        : activeGameMappingResult?.failureReason ??
          (initialDraftState ? undefined : 'The Riot active-game roster was detected but could not be mapped into the draft board.')
      : normalizedActiveGameWarning
    const activeGameMessage = recognizedPlayer.activeGame
      ? initialDraftState
        ? `Active game detected on ${routing.platformId} (${recognizedPlayer.activeGame.gameMode}). The current live roster was mapped into the draft board for composition review, but Riot public APIs still do not expose true champion-select streaming.`
        : `Active game detected on ${routing.platformId} (${recognizedPlayer.activeGame.gameMode}), but the live roster could not be mapped into the draft board yet. Riot public APIs still do not expose true champion-select streaming.`
      : normalizedActiveGameWarning
        ? `Player recognized through ${routing.regionalCluster}/${routing.platformId}. ${normalizedActiveGameWarning}`
        : `Player recognized through ${routing.regionalCluster}/${routing.platformId}, but no active game was detected.`

    return {
      recognizedPlayer,
      recognizedSession: {
        status: 'connected',
        message: activeGameMessage,
        initialDraftState,
        snapshotDebug: createRiotSnapshotDebugState({
          recognizedPlayer,
          initialDraftState,
          snapshotFailureReason,
        }),
        riotLookupDebug: recognizedPlayer.lookupDebug,
      },
    }
  } catch (error) {
    return {
      recognizedSession: {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unable to recognize the Riot player.',
        riotLookupDebug:
          error && typeof error === 'object' && 'lookupDebug' in error
            ? ((error as { lookupDebug?: RecognizedLiveSession['riotLookupDebug'] }).lookupDebug ?? undefined)
            : undefined,
      },
    }
  }
}

export function createRiotBackendLiveDraftAdapter({
  riotApiKey = getServerConfig().riotApiKey,
  clientFactory = (apiKey: string) => createRiotApiClient({ apiKey }),
  loadChampionCatalog = loadDesktopChampionCatalog,
  pollIntervalMs = 20_000,
  setIntervalFn = setInterval,
  clearIntervalFn = clearInterval,
}: CreateRiotBackendLiveDraftAdapterInput = {}): BackendLiveDraftAdapter {
  return {
    source: 'RIOT_API',
    async recognizePlayer(identity) {
      const { recognizedSession } = await buildRiotRecognitionResult(identity, {
        riotApiKey,
        clientFactory,
        loadChampionCatalog,
      })

      return recognizedSession
    },
    async subscribe(session, emitEvent) {
      let stopped = false
      let lastDraftSignature: string | undefined

      async function poll() {
        const { recognizedSession } = await buildRiotRecognitionResult(session.player, {
          riotApiKey,
          clientFactory,
          loadChampionCatalog,
        })

        if (stopped) {
          return
        }

        emitEvent({
          type: 'session-update',
          session: {
            status: recognizedSession.status,
            message: recognizedSession.message,
            snapshotDebug: recognizedSession.snapshotDebug,
            riotLookupDebug: recognizedSession.riotLookupDebug,
          },
        })

        if (recognizedSession.initialDraftState) {
          const nextDraftSignature = JSON.stringify(recognizedSession.initialDraftState)

          if (nextDraftSignature !== lastDraftSignature) {
            lastDraftSignature = nextDraftSignature
            emitEvent({
              type: 'draft-state',
              draftState: recognizedSession.initialDraftState,
            })
          }
        }
      }

      await poll().catch((error) => {
        emitEvent({
          type: 'session-update',
          session: {
            status: 'error',
            message: error instanceof Error ? error.message : String(error),
          },
        })
      })

      const timer = setIntervalFn(() => {
        void poll().catch((error) => {
          emitEvent({
            type: 'session-update',
            session: {
              status: 'error',
              message: error instanceof Error ? error.message : String(error),
            },
          })
        })
      }, pollIntervalMs)

      return () => {
        stopped = true
        clearIntervalFn(timer)
      }
    },
  }
}
