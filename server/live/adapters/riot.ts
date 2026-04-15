import { getServerConfig } from '@server/config/env'
import { createRiotApiClient } from '@server/live/riot/client'
import { getRiotRegionRouting } from '@server/live/riot/routing'
import type { BackendLiveDraftAdapter } from '@server/live/types'

export function createRiotBackendLiveDraftAdapter(): BackendLiveDraftAdapter {
  return {
    source: 'RIOT_API',
    async recognizePlayer(identity) {
      const config = getServerConfig()

      if (!config.riotApiKey) {
        return {
          status: 'error',
          message:
            'RIOT_API_KEY is not configured on the backend companion. Add a Riot API key to enable real region-aware player recognition.',
        }
      }

      try {
        const client = createRiotApiClient({ apiKey: config.riotApiKey })
        const recognizedPlayer = await client.recognizePlayerByRiotId({
          gameName: identity.gameName,
          tagLine: identity.tagLine,
          region: identity.region,
        })
        const routing = getRiotRegionRouting(identity.region)
        const activeGameMessage = recognizedPlayer.activeGame
          ? `Active game detected on ${routing.platformId} (${recognizedPlayer.activeGame.gameMode}). Public Riot APIs do not expose live champion-select picks, so full draft sync still needs a desktop bridge or a private ingestion path.`
          : `Player recognized through ${routing.regionalCluster}/${routing.platformId}, but no active game was detected.`

        return {
          status: 'connected',
          message: activeGameMessage,
        }
      } catch (error) {
        return {
          status: 'error',
          message: error instanceof Error ? error.message : 'Unable to recognize the Riot player.',
        }
      }
    },
    async subscribe(_session, emitEvent) {
      emitEvent({
        type: 'session-update',
        session: {
          status: 'error',
          message:
            'Riot public APIs can validate player identity and active-game presence, but they do not provide true champion-select draft streaming. Use the desktop-client bridge for live pick/ban sync.',
        },
      })
      return () => {}
    },
  }
}
