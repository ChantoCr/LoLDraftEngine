import { normalizeDDragonChampionCollection } from '@/data/providers/dDragon/normalize'
import { normalizeExternalPatchStatsPayload } from '@/data/providers/external/normalize'
import { createPatchDataBundle } from '@/domain/stats/factories'
import { mergePatchDataBundles } from '@/domain/stats/merge'
import { dDragonChampionCollectionFixture } from '@/testing/fixtures/stats/dDragon'
import { externalPatchStatsFixture } from '@/testing/fixtures/stats/externalStats'

export const mockChampionStatsBundle = createPatchDataBundle({
  patchVersion: '15.8',
  champions: normalizeDDragonChampionCollection(dDragonChampionCollectionFixture, {
    patchVersion: '15.8',
    fetchedAt: '2026-04-13T19:30:00.000Z',
    source: 'FIXTURE',
  }),
})

export const mockExternalStatsBundle = normalizeExternalPatchStatsPayload(externalPatchStatsFixture)

export const mockStatsBundle = mergePatchDataBundles(mockChampionStatsBundle, mockExternalStatsBundle)
