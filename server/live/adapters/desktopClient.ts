import { DesktopClientBridge } from '@server/live/desktopClient/bridge'
import type { BackendLiveDraftAdapter } from '@server/live/types'

interface CreateDesktopClientBackendLiveDraftAdapterInput {
  bridge: DesktopClientBridge
}

export function createDesktopClientBackendLiveDraftAdapter({
  bridge,
}: CreateDesktopClientBackendLiveDraftAdapterInput): BackendLiveDraftAdapter {
  return {
    source: 'DESKTOP_CLIENT',
    async recognizePlayer(identity) {
      return {
        status: 'connected',
        message: `Desktop-client bridge session opened for ${identity.gameName}#${identity.tagLine} (${identity.region}). Waiting for local client ingestion events.`,
      }
    },
    async subscribe(session, emitEvent) {
      emitEvent({
        type: 'session-update',
        session: {
          status: 'connected',
          message: 'Desktop-client stream subscribed. Waiting for bridge draft-state events.',
        },
      })

      return bridge.subscribe(session.id, emitEvent)
    },
  }
}
