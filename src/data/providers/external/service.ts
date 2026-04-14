import { PatchDataCache, createPatchCacheKey } from '@/data/cache/patchDataCache'
import type { ExternalStatsAdapter } from '@/data/providers/external/adapter'
import { normalizeExternalPatchStatsPayload } from '@/data/providers/external/normalize'
import type { LoadPatchDataBundleInput, StatsProvider } from '@/domain/stats/provider'
import type { PatchDataBundle } from '@/domain/stats/types'

interface CreateExternalStatsProviderInput {
  adapter: ExternalStatsAdapter
  cache?: PatchDataCache<PatchDataBundle>
  cacheTtlMs?: number
}

export function createExternalStatsProvider({
  adapter,
  cache = new PatchDataCache<PatchDataBundle>(),
  cacheTtlMs,
}: CreateExternalStatsProviderInput): StatsProvider {
  return {
    listAvailablePatchVersions() {
      return adapter.listAvailablePatchVersions()
    },
    async loadPatchDataBundle({ patchVersion, locale = 'global' }: LoadPatchDataBundleInput) {
      const cacheKey = createPatchCacheKey('external', patchVersion, locale)
      const cachedBundle = cache.get(cacheKey)

      if (cachedBundle) {
        return cachedBundle
      }

      const payload = await adapter.loadPatchStats({ patchVersion })
      const bundle = normalizeExternalPatchStatsPayload(payload)
      cache.set(cacheKey, bundle, cacheTtlMs)
      return bundle
    },
  }
}
