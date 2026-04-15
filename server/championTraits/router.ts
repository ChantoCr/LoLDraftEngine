import { Router } from 'express'
import type { Request, Response } from 'express'
import { createChampionTraitsService } from '@server/championTraits/service'

interface CreateChampionTraitsRouterInput {
  externalStatsUrl?: string
}

export function createChampionTraitsRouter({ externalStatsUrl }: CreateChampionTraitsRouterInput = {}) {
  const router = Router()
  const championTraitsService = createChampionTraitsService({ externalStatsUrl })

  router.get('/patch/:patchVersion/scaffold', async (request: Request, response: Response) => {
    const scaffold = await championTraitsService.loadTraitScaffold(String(request.params.patchVersion))
    response.json(scaffold)
  })

  return router
}
