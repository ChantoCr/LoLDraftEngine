import { describe, expect, it } from 'vitest'
import { buildChampionTraitScaffoldEntry } from '@/domain/champion-traits/scaffold'
import { normalizeDDragonChampionCollection } from '@/data/providers/dDragon/normalize'
import { normalizeExternalPatchStatsPayload } from '@/data/providers/external/normalize'
import { createPatchDataBundle } from '@/domain/stats/factories'
import { mergePatchDataBundles } from '@/domain/stats/merge'
import { dDragonChampionCollectionFixture } from '@/testing/fixtures/stats/dDragon'
import { externalPatchStatsFixture } from '@/testing/fixtures/stats/externalStats'

describe('buildChampionTraitScaffoldEntry', () => {
  it('builds scaffolded champion traits from champion metadata and role signals', () => {
    const championBundle = createPatchDataBundle({
      patchVersion: '15.8',
      champions: normalizeDDragonChampionCollection(dDragonChampionCollectionFixture, {
        patchVersion: '15.8',
        source: 'FIXTURE',
      }),
    })
    const mergedBundle = mergePatchDataBundles(championBundle, normalizeExternalPatchStatsPayload(externalPatchStatsFixture))
    const braum = mergedBundle.championsById.braum

    const entry = buildChampionTraitScaffoldEntry(braum)

    expect(entry.inferredRoles).toContain('SUPPORT')
    expect(entry.champion.traits.frontline).toBeGreaterThan(2)
    expect(entry.champion.traits.peel).toBeGreaterThan(2)
    expect(entry.rationale.length).toBeGreaterThan(0)
  })
})
