import { describe, expect, it, vi } from 'vitest'
import { DesktopClientBridge } from '@server/live/desktopClient/bridge'
import { mockLiveDraftTimeline } from '@/data/mock/liveDraft'

describe('DesktopClientBridge', () => {
  it('subscribes and emits backend draft events for a desktop-client session', () => {
    const bridge = new DesktopClientBridge()
    const listener = vi.fn()
    const unsubscribe = bridge.subscribe('session-1', listener)

    const listenerCount = bridge.emit('session-1', {
      type: 'draft-state',
      draftState: mockLiveDraftTimeline[0]!,
    })

    expect(listenerCount).toBe(1)
    expect(listener).toHaveBeenCalledWith({
      type: 'draft-state',
      draftState: mockLiveDraftTimeline[0]!,
    })

    unsubscribe()
    expect(bridge.emit('session-1', { type: 'session-update', session: { status: 'connected' } })).toBe(0)
  })
})
