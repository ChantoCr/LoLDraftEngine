import { useEffect, useState } from 'react'
import { fetchChampionCatalog } from '@/data/api/stats'
import type { ChampionCatalogEntry } from '@/domain/champion/catalog'

interface UseChampionCatalogOptions {
  enabled?: boolean
}

interface UseChampionCatalogResult {
  catalog: ChampionCatalogEntry[]
  isLoading: boolean
  error?: string
}

export function useChampionCatalog(
  patchVersion: string,
  fallbackCatalog: ChampionCatalogEntry[] = [],
  { enabled = true }: UseChampionCatalogOptions = {},
): UseChampionCatalogResult {
  const [catalog, setCatalog] = useState<ChampionCatalogEntry[]>(fallbackCatalog)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)

  useEffect(() => {
    let isCancelled = false

    if (!enabled) {
      setIsLoading(false)
      setError(undefined)
      setCatalog((currentCatalog) => (currentCatalog.length > 0 ? currentCatalog : fallbackCatalog))
      return () => {
        isCancelled = true
      }
    }

    async function loadCatalog() {
      setIsLoading(true)
      setError(undefined)

      try {
        const nextCatalog = await fetchChampionCatalog(patchVersion)

        if (!isCancelled) {
          setCatalog(nextCatalog)
        }
      } catch (caughtError) {
        if (!isCancelled) {
          setError(caughtError instanceof Error ? caughtError.message : 'Unable to load champion catalog.')
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadCatalog()

    return () => {
      isCancelled = true
    }
  }, [enabled, fallbackCatalog, patchVersion])

  return {
    catalog,
    isLoading,
    error,
  }
}
