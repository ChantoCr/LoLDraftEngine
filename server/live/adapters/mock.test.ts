import { describe, expect, it, vi } from 'vitest'
import { mockLiveDraftTimeline } from '@/data/mock/liveDraft'
import { createMockBackendLiveDraftAdapter } from '@server/live/adapters/mock'

describe('createMockBackendLiveDraftAdapter', () => {
  it('emits session updates and draft-state events over time', async () => {
    vi.useFakeTimers()

    try {
      const adapter = createMockBackendLiveDraftAdapter({
        timeline: mockLiveDraftTimeline.slice(0, 2),
        intervalMs: 1000,
      })
      const emitEvent = vi.fn()
      const unsubscribe = await adapter.subscribe(
        {
          id: 'session-1',
          source: 'MOCK',
          player: { gameName: 'Tester', tagLine: 'LAN', region: 'LAN' },
          status: 'connected',
          createdAt: '2026-04-13T20:30:00.000Z',
          updatedAt: '2026-04-13T20:30:00.000Z',
        },
        emitEvent,
      )

      expect(emitEvent).toHaveBeenCalledTimes(2)
      expect(emitEvent).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ type: 'session-update' }),
      )
      expect(emitEvent).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ type: 'draft-state', draftState: mockLiveDraftTimeline[0] }),
      )

      await vi.advanceTimersByTimeAsync(1000)
      expect(emitEvent).toHaveBeenLastCalledWith(
        expect.objectContaining({ type: 'draft-state', draftState: mockLiveDraftTimeline[1] }),
      )

      unsubscribe()
    } finally {
      vi.useRealTimers()
    }
  })
})
