import { describe, expect, it, vi } from 'vitest'
import { createPlayerPoolRouter } from '@server/playerPool/router'

describe('createPlayerPoolRouter', () => {
  it('returns a Riot-resolved champion pool for the requested role', async () => {
    const router = createPlayerPoolRouter({
      resolvePool: vi.fn().mockResolvedValue({
        playerLabel: 'Tester#LAN · SUPPORT pool',
        role: 'SUPPORT',
        source: 'RIOT_API',
        entries: [{ championId: 'thresh', tier: 'MAIN', masteryConfidence: 0.96 }],
      }),
    })

    const layer = router.stack[0]?.route.stack[0]?.handle
    const request = {
      body: {
        identity: {
          gameName: 'Tester',
          tagLine: 'LAN',
          region: 'LAN',
        },
        role: 'SUPPORT',
        patchVersion: '16.8.1',
      },
    }
    const response = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    }

    await layer(request, response)

    expect(response.status).not.toHaveBeenCalled()
    expect(response.json).toHaveBeenCalledWith({
      poolProfile: {
        playerLabel: 'Tester#LAN · SUPPORT pool',
        role: 'SUPPORT',
        source: 'RIOT_API',
        entries: [{ championId: 'thresh', tier: 'MAIN', masteryConfidence: 0.96 }],
      },
    })
  })
})
