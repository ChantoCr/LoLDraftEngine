import { createBackendLiveApiClient, type BackendLiveApiClient } from '@/data/providers/live/backendApi/client'
import type { BackendLiveDraftSource } from '@/data/providers/live/backendApi/types'
import type { LiveDraftProvider } from '@/domain/live/provider'
import type { LiveDraftSession, SummonerIdentity } from '@/domain/live/types'

export interface CreateBackendApiLiveDraftProviderInput {
  source: BackendLiveDraftSource
  client?: BackendLiveApiClient
}

export function createBackendApiLiveDraftProvider({
  source,
  client = createBackendLiveApiClient(),
}: CreateBackendApiLiveDraftProviderInput): LiveDraftProvider {
  return {
    async recognizePlayer(identity: SummonerIdentity): Promise<LiveDraftSession> {
      try {
        const response = await client.recognizePlayer({ identity, source })

        return {
          sessionId: response.sessionId,
          player: response.player,
          status: response.status,
          syncMode: response.syncMode,
          lastSyncAt: response.lastSyncAt,
          message: response.message,
        }
      } catch (error) {
        const fallbackMessageBySource: Record<BackendLiveDraftSource, string> = {
          MOCK: 'Unable to start the mock live provider.',
          RIOT_API:
            'Unable to reach the local live backend. Start `npm run server:dev` and put `RIOT_API_KEY=...` in `.env.local` or `.env`.',
          DESKTOP_CLIENT:
            'Unable to reach the local desktop-companion backend. Start `npm run server:dev` before opening a desktop session.',
        }

        return {
          player: identity,
          status: 'error',
          syncMode: source,
          message: error instanceof Error ? error.message : fallbackMessageBySource[source],
        }
      }
    },
    async subscribeToLiveDraft(session, onDraftState, onSessionUpdate) {
      if (!session.sessionId) {
        return () => {}
      }

      return client.subscribeToDraft({
        sessionId: session.sessionId,
        source,
        onDraftState,
        onSessionUpdate,
      })
    },
  }
}
