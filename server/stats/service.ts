import { createStaticExternalStatsAdapter } from '@/data/providers/external/adapter'
import { createExternalStatsProvider } from '@/data/providers/external/service'
import { createDDragonStatsProvider } from '@/data/providers/dDragon/service'
import { mergePatchDataBundles } from '@/domain/stats/merge'
import type { PatchDataBundle } from '@/domain/stats/types'
import { externalPatchStatsFixture } from '@/testing/fixtures/stats/externalStats'
import { createRemoteExternalStatsAdapter } from '@server/stats/externalRemoteAdapter'

interface CreateStatsServiceInput {
  externalStatsUrl?: string
  dDragonProvider?: ReturnType<typeof createDDragonStatsProvider>
  externalProvider?: ReturnType<typeof createExternalStatsProvider>
}

export interface ChampionCatalogEntry {
  id: string
  name: string
}

export function createStatsService({
  externalStatsUrl,
  dDragonProvider = createDDragonStatsProvider(),
  externalProvider = createExternalStatsProvider({
    adapter: externalStatsUrl
      ? createRemoteExternalStatsAdapter({ baseUrl: externalStatsUrl })
      : createStaticExternalStatsAdapter({
          [externalPatchStatsFixture.patchVersion]: externalPatchStatsFixture,
        }),
  }),
}: CreateStatsServiceInput = {}) {

  return {
    async listAvailablePatchVersions() {
      return dDragonProvider.listAvailablePatchVersions()
    },
    async loadPatchBundle(patchVersion: string): Promise<PatchDataBundle> {
      const championBundle = await dDragonProvider.loadPatchDataBundle({ patchVersion })

      try {
        const externalBundle = await externalProvider.loadPatchDataBundle({ patchVersion })
        return mergePatchDataBundles(championBundle, externalBundle)
      } catch {
        return championBundle
      }
    },
    async loadChampionCatalog(patchVersion: string): Promise<ChampionCatalogEntry[]> {
      const bundle = await dDragonProvider.loadPatchDataBundle({ patchVersion })

      return bundle.champions.map((champion) => ({
        id: champion.id,
        name: champion.name,
      }))
    },
  }
}
