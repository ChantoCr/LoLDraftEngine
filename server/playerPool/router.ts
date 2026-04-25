import { Router, type Request, type Response } from 'express'
import type { Role } from '@/domain/champion/types'
import { resolveRiotChampionPool } from '@server/playerPool/riot'

interface CreatePlayerPoolRouterInput {
  resolvePool?: typeof resolveRiotChampionPool
}

function isRole(value: unknown): value is Role {
  return value === 'TOP' || value === 'JUNGLE' || value === 'MID' || value === 'ADC' || value === 'SUPPORT'
}

export function createPlayerPoolRouter({ resolvePool = resolveRiotChampionPool }: CreatePlayerPoolRouterInput = {}) {
  const router = Router()

  router.post('/riot/resolve', async (request: Request, response: Response) => {
    const body = (request.body ?? {}) as {
      identity?: {
        gameName?: string
        tagLine?: string
        region?: string
      }
      role?: string
      patchVersion?: string
      limit?: number
    }

    if (!body.identity?.gameName || !body.identity?.tagLine || !body.identity?.region) {
      response.status(400).json({
        error: 'Invalid summoner identity. gameName, tagLine, and region are required.',
      })
      return
    }

    if (!isRole(body.role)) {
      response.status(400).json({
        error: 'Invalid role. TOP, JUNGLE, MID, ADC, or SUPPORT is required.',
      })
      return
    }

    try {
      const poolProfile = await resolvePool({
        identity: {
          gameName: body.identity.gameName,
          tagLine: body.identity.tagLine,
          region: body.identity.region as Parameters<typeof resolveRiotChampionPool>[0]['identity']['region'],
        },
        role: body.role,
        patchVersion: body.patchVersion ?? 'latest',
        limit: typeof body.limit === 'number' ? body.limit : undefined,
      })

      response.json({ poolProfile })
    } catch (error) {
      response.status(500).json({
        error: error instanceof Error ? error.message : 'Unable to resolve Riot champion pool.',
      })
    }
  })

  return router
}
