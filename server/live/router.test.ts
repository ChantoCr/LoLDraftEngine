import { describe, expect, it, vi } from 'vitest'
import { createLiveRouter } from '@server/live/router'
import { InMemoryLiveSessionStore } from '@server/live/sessionStore'

describe('createLiveRouter', () => {
  it('accepts DESKTOP_CLIENT recognize requests without Riot name/tag fields by normalizing a local identity', async () => {
    const sessionStore = new InMemoryLiveSessionStore()
    const router = createLiveRouter({
      sessionStore,
      adapters: {
        MOCK: {
          source: 'MOCK',
          recognizePlayer: vi.fn(),
          subscribe: vi.fn(),
        },
        RIOT_API: {
          source: 'RIOT_API',
          recognizePlayer: vi.fn(),
          subscribe: vi.fn(),
        },
        DESKTOP_CLIENT: {
          source: 'DESKTOP_CLIENT',
          recognizePlayer: vi.fn().mockResolvedValue({
            status: 'connected',
            message: 'Desktop bridge ready.',
          }),
          subscribe: vi.fn(),
        },
      },
    })

    const layer = router.stack[0]?.route.stack[0]?.handle
    const request = {
      body: {
        source: 'DESKTOP_CLIENT',
        identity: { region: 'LAN' },
      },
    }
    const response = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    }

    await layer(request, response)

    expect(response.status).not.toHaveBeenCalled()
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        player: {
          gameName: 'Desktop Companion',
          tagLine: 'LOCAL',
          region: 'LAN',
        },
        status: 'connected',
        syncMode: 'DESKTOP_CLIENT',
      }),
    )
  })
})
