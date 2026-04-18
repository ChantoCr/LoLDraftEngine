import { describe, expect, it, vi } from 'vitest'
import { createBackendApiLiveDraftProvider } from '@/data/providers/live/backendApi/provider'
import { mockLiveDraftTimeline } from '@/data/mock/liveDraft'

describe('createBackendApiLiveDraftProvider', () => {
  it('subscribes to backend draft streams once recognition succeeds', async () => {
    const unsubscribe = vi.fn()
    const client = {
      recognizePlayer: vi.fn().mockResolvedValue({
        sessionId: 'session-2',
        player: { gameName: 'Tester', tagLine: 'LAN', region: 'LAN' },
        status: 'connected',
        syncMode: 'RIOT_API',
        message: 'Connected.',
        region: 'LAN',
        snapshotDebug: {
          source: 'RIOT_API',
          snapshotMapped: false,
          lastMappingFailureReason: 'No active game snapshot is currently available from Riot spectator APIs.',
        },
      }),
      subscribeToDraft: vi.fn().mockResolvedValue(unsubscribe),
      triggerDesktopMockSequence: vi.fn(),
    }
    const provider = createBackendApiLiveDraftProvider({ source: 'RIOT_API', client })
    const session = await provider.recognizePlayer({ gameName: 'Tester', tagLine: 'LAN', region: 'LAN' })
    const onDraftState = vi.fn()

    const receivedUnsubscribe = await provider.subscribeToLiveDraft(session, onDraftState)

    expect(session.snapshotDebug).toEqual({
      source: 'RIOT_API',
      snapshotMapped: false,
      lastMappingFailureReason: 'No active game snapshot is currently available from Riot spectator APIs.',
    })
    expect(client.subscribeToDraft).toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: 'session-2', source: 'RIOT_API' }),
    )
    expect(receivedUnsubscribe).toBe(unsubscribe)
  })

  it('normalizes backend connection-refused errors into a cleaner source-aware message', async () => {
    const client = {
      recognizePlayer: vi.fn().mockRejectedValue(new Error('ProxyError /api/live/session/recognize AggregateError ECONNREFUSED')),
      subscribeToDraft: vi.fn(),
      triggerDesktopMockSequence: vi.fn(),
    }
    const provider = createBackendApiLiveDraftProvider({ source: 'DESKTOP_CLIENT', client })

    const session = await provider.recognizePlayer({ gameName: 'Tester', tagLine: 'LAN', region: 'LAN' })

    expect(session).toMatchObject({
      status: 'error',
      syncMode: 'DESKTOP_CLIENT',
      message: 'Unable to reach the local desktop-companion backend. Start `npm run server:dev` before opening a desktop session.',
    })
  })

  it('returns a no-op unsubscribe when no backend session id exists', async () => {
    const client = {
      recognizePlayer: vi.fn(),
      subscribeToDraft: vi.fn(),
      triggerDesktopMockSequence: vi.fn(),
    }
    const provider = createBackendApiLiveDraftProvider({ source: 'DESKTOP_CLIENT', client })
    const unsubscribe = await provider.subscribeToLiveDraft(
      { status: 'error', syncMode: 'DESKTOP_CLIENT', message: 'No session id available.' },
      () => mockLiveDraftTimeline[0],
    )

    expect(client.subscribeToDraft).not.toHaveBeenCalled()
    expect(typeof unsubscribe).toBe('function')
  })
})
