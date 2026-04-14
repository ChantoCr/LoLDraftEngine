import { createDesktopClientLiveDraftProvider } from '@/data/providers/live/desktopClient'
import { createMockLiveDraftProvider } from '@/data/providers/live/mock'
import { createRiotApiLiveDraftProvider } from '@/data/providers/live/riot'
import type { LiveDraftProvider } from '@/domain/live/provider'
import type { LiveDraftSyncMode } from '@/domain/live/types'

export function createLiveDraftProviders(): Partial<Record<LiveDraftSyncMode, LiveDraftProvider>> {
  return {
    MOCK: createMockLiveDraftProvider(),
    RIOT_API: createRiotApiLiveDraftProvider(),
    DESKTOP_CLIENT: createDesktopClientLiveDraftProvider(),
  }
}
