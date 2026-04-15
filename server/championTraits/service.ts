import { createStatsService } from '@server/stats/service'
import { buildChampionTraitScaffoldDataset } from '@/domain/champion-traits/scaffold'

interface CreateChampionTraitsServiceInput {
  externalStatsUrl?: string
  statsService?: ReturnType<typeof createStatsService>
}

export function createChampionTraitsService({
  externalStatsUrl,
  statsService = createStatsService({ externalStatsUrl }),
}: CreateChampionTraitsServiceInput = {}) {

  return {
    async loadTraitScaffold(patchVersion: string) {
      const bundle = await statsService.loadPatchBundle(patchVersion)
      return buildChampionTraitScaffoldDataset(bundle)
    },
  }
}
