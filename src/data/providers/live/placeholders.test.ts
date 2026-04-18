import { describe, expect, it, vi } from 'vitest'
import { createDesktopClientLiveDraftProvider } from '@/data/providers/live/desktopClient'
import { createRiotApiLiveDraftProvider } from '@/data/providers/live/riot'

describe('backend live draft providers', () => {
  it('maps Riot backend recognize responses into live sessions', async () => {
    const client = {
      recognizePlayer: vi.fn().mockResolvedValue({
        sessionId: 'riot-session-1',
        player: { gameName: 'Tester', tagLine: 'LAN', region: 'LAN' },
        status: 'connected',
        syncMode: 'RIOT_API',
        message: 'Connected through Riot backend.',
        lastSyncAt: '2026-04-13T20:10:00.000Z',
        region: 'LAN',
      }),
      subscribeToDraft: vi.fn().mockResolvedValue(() => {}),
      triggerDesktopMockSequence: vi.fn(),
    }
    const provider = createRiotApiLiveDraftProvider({ client })
    const session = await provider.recognizePlayer({ gameName: 'Tester', tagLine: 'LAN', region: 'LAN' })

    expect(session).toMatchObject({
      sessionId: 'riot-session-1',
      status: 'connected',
      syncMode: 'RIOT_API',
    })
  })

  it('surfaces local backend errors for desktop-client mode cleanly', async () => {
    const client = {
      recognizePlayer: vi.fn().mockRejectedValue(new Error('Local companion API is offline.')),
      subscribeToDraft: vi.fn(),
      triggerDesktopMockSequence: vi.fn(),
    }
    const provider = createDesktopClientLiveDraftProvider({ client })
    const session = await provider.recognizePlayer({ gameName: 'Tester', tagLine: 'LAN', region: 'LAN' })

    expect(session.status).toBe('error')
    expect(session.message).toContain('Local companion API is offline.')
  })
})
