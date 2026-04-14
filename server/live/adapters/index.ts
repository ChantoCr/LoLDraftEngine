import type { BackendLiveDraftSource } from '@/data/providers/live/backendApi/types'
import { createDesktopClientBackendLiveDraftAdapter } from '@server/live/adapters/desktopClient'
import { createMockBackendLiveDraftAdapter } from '@server/live/adapters/mock'
import { createRiotBackendLiveDraftAdapter } from '@server/live/adapters/riot'
import type { BackendLiveDraftAdapter } from '@server/live/types'

export function createBackendLiveDraftAdapters(): Record<BackendLiveDraftSource, BackendLiveDraftAdapter> {
  return {
    MOCK: createMockBackendLiveDraftAdapter(),
    RIOT_API: createRiotBackendLiveDraftAdapter(),
    DESKTOP_CLIENT: createDesktopClientBackendLiveDraftAdapter(),
  }
}
