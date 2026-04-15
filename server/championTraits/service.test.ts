import { describe, expect, it } from 'vitest'
import { createChampionTraitsService } from '@server/championTraits/service'
import { mockChampionStatsBundle, mockStatsBundle } from '@/data/mock/stats'
import { mergePatchDataBundles } from '@/domain/stats/merge'

describe('createChampionTraitsService', () => {
  it('loads a scaffold dataset for a patch from the provided stats service', async () => {
    const statsService = {
      listAvailablePatchVersions: async () => ['15.8'],
      loadPatchBundle: async () => mergePatchDataBundles(mockChampionStatsBundle, mockStatsBundle),
      loadChampionCatalog: async () => [],
    }
    const service = createChampionTraitsService({ statsService })
    const dataset = await service.loadTraitScaffold('15.8')

    expect(dataset.length).toBeGreaterThan(0)
    expect(dataset.some((entry) => entry.championId === 'braum')).toBe(true)
  })
})
