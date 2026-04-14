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
      }),
      subscribeToDraft: vi.fn().mockResolvedValue(unsubscribe),
    }
    const provider = createBackendApiLiveDraftProvider({ source: 'RIOT_API', client })
    const session = await provider.recognizePlayer({ gameName: 'Tester', tagLine: 'LAN', region: 'LAN' })
    const onDraftState = vi.fn()

    const receivedUnsubscribe = await provider.subscribeToLiveDraft(session, onDraftState)

    expect(client.subscribeToDraft).toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: 'session-2', source: 'RIOT_API' }),
    )
    expect(receivedUnsubscribe).toBe(unsubscribe)
  })

  it('returns a no-op unsubscribe when no backend session id exists', async () => {
    const client = {
      recognizePlayer: vi.fn(),
      subscribeToDraft: vi.fn(),
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
