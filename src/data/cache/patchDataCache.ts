export interface PatchCacheEntry<TValue> {
  value: TValue
  expiresAt?: number
}

export class PatchDataCache<TValue> {
  private readonly store = new Map<string, PatchCacheEntry<TValue>>()

  get(key: string) {
    const entry = this.store.get(key)

    if (!entry) {
      return undefined
    }

    if (entry.expiresAt && entry.expiresAt <= Date.now()) {
      this.store.delete(key)
      return undefined
    }

    return entry.value
  }

  set(key: string, value: TValue, ttlMs?: number) {
    this.store.set(key, {
      value,
      expiresAt: ttlMs ? Date.now() + ttlMs : undefined,
    })

    return value
  }

  clear(key?: string) {
    if (key) {
      this.store.delete(key)
      return
    }

    this.store.clear()
  }
}

export function createPatchCacheKey(provider: string, patchVersion: string, locale = 'en_US') {
  return `${provider}:${patchVersion}:${locale}`
}
