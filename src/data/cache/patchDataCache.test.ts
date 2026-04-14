import { describe, expect, it } from 'vitest'
import { PatchDataCache, createPatchCacheKey } from '@/data/cache/patchDataCache'

describe('PatchDataCache', () => {
  it('stores and retrieves values by provider/patch/locale key', () => {
    const cache = new PatchDataCache<string>()
    const key = createPatchCacheKey('ddragon', '15.8', 'en_US')

    cache.set(key, 'bundle')

    expect(cache.get(key)).toBe('bundle')
  })

  it('creates stable cache keys for patch-scoped bundles', () => {
    expect(createPatchCacheKey('ddragon', '15.8', 'en_US')).toBe('ddragon:15.8:en_US')
    expect(createPatchCacheKey('ddragon', '15.8')).toBe('ddragon:15.8:en_US')
  })
})
