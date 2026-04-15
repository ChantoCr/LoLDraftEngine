import type { BackendLiveDraftSource } from '@/data/providers/live/backendApi/types'
import { createDesktopClientBackendLiveDraftAdapter } from '@server/live/adapters/desktopClient'
import { createMockBackendLiveDraftAdapter } from '@server/live/adapters/mock'
import { createRiotBackendLiveDraftAdapter } from '@server/live/adapters/riot'
import { DesktopClientBridge } from '@server/live/desktopClient/bridge'
import type { BackendLiveDraftAdapter } from '@server/live/types'

interface CreateBackendLiveDraftAdaptersInput {
  desktopClientBridge: DesktopClientBridge
}

export function createBackendLiveDraftAdapters({
  desktopClientBridge,
}: CreateBackendLiveDraftAdaptersInput): Record<BackendLiveDraftSource, BackendLiveDraftAdapter> {
  return {
    MOCK: createMockBackendLiveDraftAdapter(),
    RIOT_API: createRiotBackendLiveDraftAdapter(),
    DESKTOP_CLIENT: createDesktopClientBackendLiveDraftAdapter({ bridge: desktopClientBridge }),
  }
}
