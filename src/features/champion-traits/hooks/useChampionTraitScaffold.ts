import { useEffect, useState } from 'react'
import { fetchChampionTraitScaffold } from '@/data/api/championTraits'
import type { ChampionTraitScaffoldEntry } from '@/domain/champion-traits/types'

export function useChampionTraitScaffold(
  patchVersion: string,
  fallbackEntries: ChampionTraitScaffoldEntry[] = [],
) {
  const [entries, setEntries] = useState<ChampionTraitScaffoldEntry[]>(fallbackEntries)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)

  useEffect(() => {
    let isCancelled = false

    async function loadScaffold() {
      setIsLoading(true)
      setError(undefined)

      try {
        const nextEntries = await fetchChampionTraitScaffold(patchVersion)

        if (!isCancelled) {
          setEntries(nextEntries)
        }
      } catch (caughtError) {
        if (!isCancelled) {
          setError(caughtError instanceof Error ? caughtError.message : 'Unable to load champion trait scaffold.')
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadScaffold()

    return () => {
      isCancelled = true
    }
  }, [patchVersion])

  return {
    entries,
    isLoading,
    error,
  }
}
