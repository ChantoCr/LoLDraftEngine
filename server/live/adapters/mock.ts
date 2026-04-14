import { mockLiveDraftTimeline } from '@/data/mock/liveDraft'
import type { BackendLiveDraftAdapter } from '@server/live/types'

interface CreateMockBackendLiveDraftAdapterInput {
  timeline?: typeof mockLiveDraftTimeline
  intervalMs?: number
}

export function createMockBackendLiveDraftAdapter({
  timeline = mockLiveDraftTimeline,
  intervalMs = 2500,
}: CreateMockBackendLiveDraftAdapterInput = {}): BackendLiveDraftAdapter {
  return {
    source: 'MOCK',
    async recognizePlayer() {
      return {
        status: 'connected',
        message: 'Mock backend live feed connected successfully.',
      }
    },
    async subscribe(session, emitEvent) {
      if (timeline.length === 0) {
        emitEvent({
          type: 'session-update',
          session: {
            status: 'error',
            message: 'Mock timeline is empty.',
          },
        })
        return () => {}
      }

      let currentIndex = 0
      emitEvent({
        type: 'session-update',
        session: {
          status: 'connected',
          message: `Streaming mock live draft for ${session.player.gameName}#${session.player.tagLine}.`,
        },
      })
      emitEvent({
        type: 'draft-state',
        draftState: timeline[currentIndex]!,
      })

      const intervalId = setInterval(() => {
        currentIndex = (currentIndex + 1) % timeline.length
        emitEvent({
          type: 'draft-state',
          draftState: timeline[currentIndex]!,
        })
      }, intervalMs)

      return () => {
        clearInterval(intervalId)
      }
    },
  }
}
