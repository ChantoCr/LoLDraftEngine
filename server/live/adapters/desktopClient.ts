import type { BackendLiveDraftAdapter } from '@server/live/types'

export function createDesktopClientBackendLiveDraftAdapter(): BackendLiveDraftAdapter {
  return {
    source: 'DESKTOP_CLIENT',
    async recognizePlayer(identity) {
      return {
        status: 'error',
        message: `Desktop-client live draft recognition for ${identity.region} is scaffolded, but still requires a local companion bridge capable of reading champion-select state.`,
      }
    },
    async subscribe(_session, emitEvent) {
      emitEvent({
        type: 'session-update',
        session: {
          status: 'error',
          message:
            'Desktop-client live draft streaming is not implemented yet. Build the local bridge behind this adapter next.',
        },
      })
      return () => {}
    },
  }
}
