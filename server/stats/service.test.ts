import { describe, expect, it } from 'vitest'
import { createStatsService } from '@server/stats/service'
import { mockChampionStatsBundle, mockExternalStatsBundle } from '@/data/mock/stats'

describe('createStatsService', () => {
  it('merges champion metadata and external stats providers into a patch bundle', async () => {
    const service = createStatsService({
      dDragonProvider: {
        listAvailablePatchVersions: async () => ['15.8'],
        loadPatchDataBundle: async () => mockChampionStatsBundle,
      },
      externalProvider: {
        listAvailablePatchVersions: async () => ['15.8'],
        loadPatchDataBundle: async () => mockExternalStatsBundle,
      },
    })

    const bundle = await service.loadPatchBundle('15.8')

    expect(bundle.championsById.braum?.name).toBe('Braum')
    expect(bundle.metaSignals.length).toBeGreaterThan(0)
  })
})
