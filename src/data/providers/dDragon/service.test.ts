import { describe, expect, it, vi } from 'vitest'
import { PatchDataCache } from '@/data/cache/patchDataCache'
import { createDDragonStatsProvider } from '@/data/providers/dDragon/service'
import { dDragonChampionCollectionFixture } from '@/testing/fixtures/stats/dDragon'

describe('createDDragonStatsProvider', () => {
  it('loads and caches patch bundles by patch version and locale', async () => {
    const client = {
      fetchVersions: vi.fn().mockResolvedValue(['15.8.1']),
      fetchChampionCollection: vi.fn().mockResolvedValue(dDragonChampionCollectionFixture),
    }
    const provider = createDDragonStatsProvider({
      client,
      cache: new PatchDataCache(),
      now: () => '2026-04-13T18:35:00.000Z',
    })

    const firstBundle = await provider.loadPatchDataBundle({ patchVersion: '15.8', locale: 'en_US' })
    const secondBundle = await provider.loadPatchDataBundle({ patchVersion: '15.8', locale: 'en_US' })

    expect(client.fetchChampionCollection).toHaveBeenCalledTimes(1)
    expect(firstBundle).toBe(secondBundle)
    expect(firstBundle.patchVersion).toBe('15.8')
    expect(Object.keys(firstBundle.championsById)).toEqual(['braum', 'nautilus'])
  })
})
