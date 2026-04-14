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
        return {
          player: identity,
          status: 'error',
          syncMode: source,
          message:
            error instanceof Error
              ? error.message
              : 'Unable to connect to the local live-draft backend. Ensure the companion API is running.',
        }
      }
    },
    async subscribeToLiveDraft(session, onDraftState) {
      if (!session.sessionId) {
        return () => {}
      }

      return client.subscribeToDraft({
        sessionId: session.sessionId,
        source,
        onDraftState,
      })
    },
  }
}
