import { describe, expect, it, vi } from 'vitest'
import { mockLiveDraftTimeline } from '@/data/mock/liveDraft'
import { createDesktopClientRouter } from '@server/live/desktopClient/router'
import { DesktopClientBridge } from '@server/live/desktopClient/bridge'
import { InMemoryLiveSessionStore } from '@server/live/sessionStore'

function createDesktopSessionStore() {
  const sessionStore = new InMemoryLiveSessionStore()
  sessionStore.create({
    id: 'desktop-session-1',
    source: 'DESKTOP_CLIENT',
    player: { gameName: 'Tester', tagLine: 'LAN', region: 'LAN' },
    status: 'connected',
    createdAt: '2026-04-13T21:30:00.000Z',
    updatedAt: '2026-04-13T21:30:00.000Z',
  })
  return sessionStore
}

describe('createDesktopClientRouter', () => {
  it('accepts desktop-client draft ingestion, forwards events to the bridge, and returns an ack payload', () => {
    const bridge = new DesktopClientBridge()
    const sessionStore = createDesktopSessionStore()
    const router = createDesktopClientRouter({ sessionStore, bridge })
    const layer = router.stack[0]?.route.stack[0]?.handle
    const listener = vi.fn()
    bridge.subscribe('desktop-session-1', listener)
    const request = {
      get: vi.fn(),
      params: { sessionId: 'desktop-session-1' },
      body: {
        metadata: { eventId: 'evt-1', source: 'desktop-companion', companionInstanceId: 'companion-1' },
        session: { status: 'connected', message: 'Bridge connected.' },
        draftState: mockLiveDraftTimeline[0],
      },
    }
    const response = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    }

    layer(request, response)

    expect(listener).toHaveBeenNthCalledWith(1, {
      type: 'session-update',
      session: { status: 'connected', message: 'Bridge connected.' },
    })
    expect(listener).toHaveBeenNthCalledWith(2, {
      type: 'draft-state',
      draftState: mockLiveDraftTimeline[0],
    })
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: true,
        sessionId: 'desktop-session-1',
        acceptedEvents: ['session-update', 'draft-state'],
        listenerNotifications: 2,
      }),
    )
  })

  it('accepts heartbeat payloads and forwards a session health update', () => {
    const bridge = new DesktopClientBridge()
    const sessionStore = createDesktopSessionStore()
    const router = createDesktopClientRouter({ sessionStore, bridge })
    const layer = router.stack[0]?.route.stack[0]?.handle
    const listener = vi.fn()
    bridge.subscribe('desktop-session-1', listener)
    const request = {
      get: vi.fn(),
      params: { sessionId: 'desktop-session-1' },
      body: {
        metadata: { eventId: 'heartbeat-1', companionInstanceId: 'companion-1' },
        heartbeat: { observedAt: '2026-04-15T23:50:00.000Z' },
      },
    }
    const response = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    }

    layer(request, response)

    expect(listener).toHaveBeenCalledWith({
      type: 'session-update',
      session: {
        status: 'connected',
        message: 'Desktop companion heartbeat received from companion-1.',
      },
    })
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        acceptedEvents: ['heartbeat'],
      }),
    )
    expect(sessionStore.get('desktop-session-1')).toMatchObject({
      lastHeartbeatAt: '2026-04-15T23:50:00.000Z',
      companionInstanceId: 'companion-1',
      lastIngestEventId: 'heartbeat-1',
    })
  })

  it('ignores duplicate or stale desktop-companion ingest events', () => {
    const bridge = new DesktopClientBridge()
    const sessionStore = createDesktopSessionStore()
    sessionStore.update('desktop-session-1', {
      companionInstanceId: 'companion-1',
      lastIngestEventId: 'evt-2',
      lastIngestSequenceNumber: 2,
    })
    const router = createDesktopClientRouter({ sessionStore, bridge })
    const layer = router.stack[0]?.route.stack[0]?.handle
    const listener = vi.fn()
    bridge.subscribe('desktop-session-1', listener)
    const request = {
      get: vi.fn(),
      params: { sessionId: 'desktop-session-1' },
      body: {
        metadata: {
          eventId: 'evt-1',
          companionInstanceId: 'companion-1',
          sequenceNumber: 1,
        },
        draftState: mockLiveDraftTimeline[0],
      },
    }
    const response = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    }

    layer(request, response)

    expect(listener).not.toHaveBeenCalled()
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        acceptedEvents: [],
        listenerNotifications: 0,
        ignoredReason: 'stale-sequence',
      }),
    )
  })

  it('rejects unauthorized ingest requests when a companion token is configured', () => {
    const bridge = new DesktopClientBridge()
    const sessionStore = createDesktopSessionStore()
    const router = createDesktopClientRouter({ sessionStore, bridge, companionToken: 'secret-token' })
    const layer = router.stack[0]?.route.stack[0]?.handle
    const request = {
      get: vi.fn().mockReturnValue(undefined),
      params: { sessionId: 'desktop-session-1' },
      body: {
        heartbeat: { observedAt: '2026-04-15T23:50:00.000Z' },
      },
    }
    const response = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    }

    layer(request, response)

    expect(response.status).toHaveBeenCalledWith(401)
    expect(response.json).toHaveBeenCalledWith({
      message: 'Desktop companion ingest is not authorized for this backend.',
    })
  })

  it('rejects empty desktop-client ingest payloads', () => {
    const bridge = new DesktopClientBridge()
    const sessionStore = createDesktopSessionStore()
    const router = createDesktopClientRouter({ sessionStore, bridge })
    const layer = router.stack[0]?.route.stack[0]?.handle
    const request = {
      get: vi.fn(),
      params: { sessionId: 'desktop-session-1' },
      body: {},
    }
    const response = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    }

    layer(request, response)

    expect(response.status).toHaveBeenCalledWith(400)
    expect(response.json).toHaveBeenCalledWith({
      message: 'Desktop-client ingest requires a heartbeat, session update, or draft state payload.',
    })
  })
})
