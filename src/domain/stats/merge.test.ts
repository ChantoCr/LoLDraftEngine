import { describe, expect, it } from 'vitest'
import { normalizeDDragonChampionCollection } from '@/data/providers/dDragon/normalize'
import { normalizeExternalPatchStatsPayload } from '@/data/providers/external/normalize'
import { createPatchDataBundle } from '@/domain/stats/factories'
import { mergePatchDataBundles } from '@/domain/stats/merge'
import {
  getChampionRolePerformance,
  getChampionMetaSignal,
  getMatchupSignal,
  getSynergySignal,
} from '@/domain/stats/selectors'
import { dDragonChampionCollectionFixture } from '@/testing/fixtures/stats/dDragon'
import { externalPatchStatsFixture } from '@/testing/fixtures/stats/externalStats'

describe('mergePatchDataBundles', () => {
  it('merges Data Dragon champions with external meta, matchup, and synergy signals', () => {
    const championBundle = createPatchDataBundle({
      patchVersion: '15.8',
      champions: normalizeDDragonChampionCollection(dDragonChampionCollectionFixture, {
        patchVersion: '15.8',
        fetchedAt: '2026-04-13T19:35:00.000Z',
        source: 'FIXTURE',
      }),
    })
    const externalBundle = normalizeExternalPatchStatsPayload(externalPatchStatsFixture)
    const mergedBundle = mergePatchDataBundles(championBundle, externalBundle)

    expect(Object.keys(mergedBundle.championsById)).toEqual(['braum', 'nautilus'])
    expect(getChampionMetaSignal(mergedBundle, 'braum', 'SUPPORT')?.tier).toBe('A')
    expect(getChampionRolePerformance(mergedBundle, 'braum', 'SUPPORT')).toMatchObject({
      role: 'SUPPORT',
      winRate: 0.514,
      pickRate: 0.072,
    })
    expect(getMatchupSignal(mergedBundle, 'braum', 'SUPPORT', 'rakan')?.deltaWinRate).toBe(0.021)
    expect(getSynergySignal(mergedBundle, 'braum', 'jinx')?.synergyScore).toBe(8.7)
    expect(mergedBundle.freshness.length).toBeGreaterThanOrEqual(2)
    expect(mergedBundle.freshness.some((entry) => entry.patchVersion === '15.8')).toBe(true)
  })
})
