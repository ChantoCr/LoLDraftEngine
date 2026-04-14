import { PatchDataCache, createPatchCacheKey } from '@/data/cache/patchDataCache'
import { createDDragonClient, type DDragonClient } from '@/data/providers/dDragon/client'
import { normalizeDDragonChampionCollection } from '@/data/providers/dDragon/normalize'
import type { LoadPatchDataBundleInput, StatsProvider } from '@/domain/stats/provider'
import { createPatchDataBundle } from '@/domain/stats/factories'
import type { PatchDataBundle } from '@/domain/stats/types'

interface CreateDDragonStatsProviderInput {
  client?: DDragonClient
  cache?: PatchDataCache<PatchDataBundle>
  cacheTtlMs?: number
  now?: () => string
}

export function createDDragonStatsProvider({
  client = createDDragonClient(),
  cache = new PatchDataCache<PatchDataBundle>(),
  cacheTtlMs,
  now = () => new Date().toISOString(),
}: CreateDDragonStatsProviderInput = {}): StatsProvider {
  return {
    listAvailablePatchVersions() {
      return client.fetchVersions()
    },
    async loadPatchDataBundle({ patchVersion, locale = 'en_US' }: LoadPatchDataBundleInput) {
      const cacheKey = createPatchCacheKey('ddragon', patchVersion, locale)
      const cachedBundle = cache.get(cacheKey)

      if (cachedBundle) {
        return cachedBundle
      }

      const payload = await client.fetchChampionCollection({ patchVersion, locale })
      const champions = normalizeDDragonChampionCollection(payload, {
        patchVersion,
        locale,
        fetchedAt: now(),
      })
      const bundle = createPatchDataBundle({
        patchVersion,
        champions,
      })

      cache.set(cacheKey, bundle, cacheTtlMs)

      return bundle
    },
  }
}
