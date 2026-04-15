import { describe, expect, it, vi } from 'vitest'
import { createDesktopClientBackendLiveDraftAdapter } from '@server/live/adapters/desktopClient'
import { DesktopClientBridge } from '@server/live/desktopClient/bridge'
import { mockLiveDraftTimeline } from '@/data/mock/liveDraft'

describe('createDesktopClientBackendLiveDraftAdapter', () => {
  it('subscribes desktop sessions to bridge events', async () => {
    const bridge = new DesktopClientBridge()
    const adapter = createDesktopClientBackendLiveDraftAdapter({ bridge })
    const emitEvent = vi.fn()
    const unsubscribe = await adapter.subscribe(
      {
        id: 'desktop-session-2',
        source: 'DESKTOP_CLIENT',
        player: { gameName: 'Tester', tagLine: 'LAN', region: 'LAN' },
        status: 'connected',
        createdAt: '2026-04-13T22:00:00.000Z',
        updatedAt: '2026-04-13T22:00:00.000Z',
      },
      emitEvent,
    )

    bridge.emit('desktop-session-2', { type: 'draft-state', draftState: mockLiveDraftTimeline[0]! })

    expect(emitEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'session-update' }))
    expect(emitEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'draft-state' }))

    unsubscribe()
  })
})
