import { describe, expect, it, vi } from 'vitest'
import { PatchDataCache } from '@/data/cache/patchDataCache'
import { createStaticExternalStatsAdapter } from '@/data/providers/external/adapter'
import { createExternalStatsProvider } from '@/data/providers/external/service'
import { externalPatchStatsFixture } from '@/testing/fixtures/stats/externalStats'

describe('createExternalStatsProvider', () => {
  it('loads and caches external stats bundles from a generic adapter', async () => {
    const adapter = createStaticExternalStatsAdapter({
      '15.8': externalPatchStatsFixture,
    })
    const spy = vi.spyOn(adapter, 'loadPatchStats')
    const provider = createExternalStatsProvider({
      adapter,
      cache: new PatchDataCache(),
    })

    const firstBundle = await provider.loadPatchDataBundle({ patchVersion: '15.8' })
    const secondBundle = await provider.loadPatchDataBundle({ patchVersion: '15.8' })

    expect(spy).toHaveBeenCalledTimes(1)
    expect(firstBundle).toBe(secondBundle)
    expect(firstBundle.metaSignals.map((signal) => signal.championId)).toEqual([
      'braum',
      'nautilus',
      'sejuani',
    ])
  })
})
