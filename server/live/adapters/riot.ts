import type { BackendLiveDraftAdapter } from '@server/live/types'

export function createRiotBackendLiveDraftAdapter(): BackendLiveDraftAdapter {
  return {
    source: 'RIOT_API',
    async recognizePlayer(identity) {
      return {
        status: 'error',
        message: `Riot-backed live draft recognition for ${identity.region} is scaffolded, but still requires a real backend integration, Riot credentials, and champion-select ingestion pipeline.`,
      }
    },
    async subscribe(_session, emitEvent) {
      emitEvent({
        type: 'session-update',
        session: {
          status: 'error',
          message:
            'Riot live draft streaming is not implemented yet. Build the backend integration behind this adapter next.',
        },
      })
      return () => {}
    },
  }
}
