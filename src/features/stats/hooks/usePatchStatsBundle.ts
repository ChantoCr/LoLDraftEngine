import { useEffect, useState } from 'react'
import { createDDragonStatsProvider } from '@/data/providers/dDragon/service'
import type { PatchDataBundle } from '@/domain/stats/types'

const directStatsProvider = createDDragonStatsProvider()

interface UsePatchStatsBundleResult {
  bundle?: PatchDataBundle
  isLoading: boolean
  error?: string
}

export function usePatchStatsBundle(
  patchVersion: string,
  fallbackBundle?: PatchDataBundle,
): UsePatchStatsBundleResult {
  const [bundle, setBundle] = useState<PatchDataBundle | undefined>(fallbackBundle)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)

  useEffect(() => {
    let isCancelled = false

    async function loadBundle() {
      setIsLoading(true)
      setError(undefined)

      try {
        const nextBundle = await directStatsProvider.loadPatchDataBundle({ patchVersion })

        if (!isCancelled) {
          setBundle(nextBundle)
        }
      } catch (caughtError) {
        if (!isCancelled) {
          if (fallbackBundle) {
            setBundle(fallbackBundle)
          }

          setError(caughtError instanceof Error ? caughtError.message : 'Unable to load patch stats bundle.')
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadBundle()

    return () => {
      isCancelled = true
    }
  }, [fallbackBundle, patchVersion])

  return {
    bundle,
    isLoading,
    error,
  }
}
