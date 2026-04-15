import { Router } from 'express'
import type { Request, Response } from 'express'
import { createStatsService } from '@server/stats/service'

interface CreateStatsRouterInput {
  externalStatsUrl?: string
}

export function createStatsRouter({ externalStatsUrl }: CreateStatsRouterInput = {}) {
  const router = Router()
  const statsService = createStatsService({ externalStatsUrl })

  router.get('/patches', async (_request: Request, response: Response) => {
    const patches = await statsService.listAvailablePatchVersions()
    response.json(patches)
  })

  router.get('/patch/:patchVersion/catalog', async (request: Request, response: Response) => {
    const catalog = await statsService.loadChampionCatalog(String(request.params.patchVersion))
    response.json(catalog)
  })

  router.get('/patch/:patchVersion/bundle', async (request: Request, response: Response) => {
    const bundle = await statsService.loadPatchBundle(String(request.params.patchVersion))
    response.json(bundle)
  })

  return router
}
