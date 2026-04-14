import { describe, expect, it } from 'vitest'
import { normalizeExternalPatchStatsPayload } from '@/data/providers/external/normalize'
import { externalPatchStatsFixture } from '@/testing/fixtures/stats/externalStats'

describe('normalizeExternalPatchStatsPayload', () => {
  it('normalizes fixture-based meta, matchup, and synergy stats into patch bundle signals', () => {
    const bundle = normalizeExternalPatchStatsPayload(externalPatchStatsFixture)

    expect(bundle.patchVersion).toBe('15.8')
    expect(bundle.champions).toEqual([])
    expect(bundle.metaSignals).toHaveLength(3)
    expect(bundle.matchupSignals).toHaveLength(2)
    expect(bundle.synergySignals).toHaveLength(2)
    expect(bundle.metaSignals[0]).toMatchObject({
      championId: 'braum',
      role: 'SUPPORT',
      tier: 'A',
      source: 'FIXTURE',
    })
    expect(bundle.freshness[0]).toMatchObject({
      patchVersion: '15.8',
      source: 'FIXTURE',
      fetchedAt: '2026-04-13T19:30:00.000Z',
      isStale: false,
    })
  })
})
