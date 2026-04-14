import { mockLiveDraftTimeline } from '@/data/mock/liveDraft'
import type { DraftState } from '@/domain/draft/types'
import type { LiveDraftProvider } from '@/domain/live/provider'
import type { LiveDraftSession, SummonerIdentity } from '@/domain/live/types'

interface CreateMockLiveDraftProviderInput {
  timeline?: DraftState[]
  intervalMs?: number
  now?: () => string
}

export function createMockLiveDraftProvider({
  timeline = mockLiveDraftTimeline,
  intervalMs = 2500,
  now = () => new Date().toISOString(),
}: CreateMockLiveDraftProviderInput = {}): LiveDraftProvider {
  return {
    async recognizePlayer(identity: SummonerIdentity): Promise<LiveDraftSession> {
      return {
        player: identity,
        status: 'connected',
        syncMode: 'MOCK',
        lastSyncAt: now(),
        message: 'Mock live draft feed connected. Draft-state snapshots will stream into the workspace.',
      }
    },
    async subscribeToLiveDraft(_session, onDraftState) {
      if (timeline.length === 0) {
        return async () => {}
      }

      let currentIndex = 0
      onDraftState(timeline[currentIndex]!)

      const intervalId = globalThis.setInterval(() => {
        currentIndex = (currentIndex + 1) % timeline.length
        onDraftState(timeline[currentIndex]!)
      }, intervalMs)

      return () => {
        globalThis.clearInterval(intervalId)
      }
    },
  }
}
