import { describe, expect, it, vi } from 'vitest'
import { mockLiveDraftTimeline } from '@/data/mock/liveDraft'
import { createMockLiveDraftProvider } from '@/data/providers/live/mock'

describe('createMockLiveDraftProvider', () => {
  it('recognizes a player and streams draft-state snapshots over time', async () => {
    vi.useFakeTimers()

    try {
      const provider = createMockLiveDraftProvider({
        timeline: mockLiveDraftTimeline.slice(0, 2),
        intervalMs: 1000,
        now: () => '2026-04-13T20:00:00.000Z',
      })
      const session = await provider.recognizePlayer({ gameName: 'Tester', tagLine: 'LAN', region: 'LAN' })
      const onDraftState = vi.fn()
      const unsubscribe = await provider.subscribeToLiveDraft(session, onDraftState)

      expect(session.status).toBe('connected')
      expect(onDraftState).toHaveBeenCalledTimes(1)
      expect(onDraftState).toHaveBeenLastCalledWith(mockLiveDraftTimeline[0])

      await vi.advanceTimersByTimeAsync(1000)
      expect(onDraftState).toHaveBeenCalledTimes(2)
      expect(onDraftState).toHaveBeenLastCalledWith(mockLiveDraftTimeline[1])

      unsubscribe()
      await vi.advanceTimersByTimeAsync(1000)
      expect(onDraftState).toHaveBeenCalledTimes(2)
    } finally {
      vi.useRealTimers()
    }
  })
})
