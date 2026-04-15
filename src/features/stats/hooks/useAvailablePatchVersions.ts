import { useEffect, useState } from 'react'
import { createDDragonStatsProvider } from '@/data/providers/dDragon/service'

const directStatsProvider = createDDragonStatsProvider()

interface UseAvailablePatchVersionsResult {
  patchVersions: string[]
  isLoading: boolean
  error?: string
}

export function useAvailablePatchVersions(): UseAvailablePatchVersionsResult {
  const [patchVersions, setPatchVersions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)

  useEffect(() => {
    let isCancelled = false

    async function loadPatchVersions() {
      setIsLoading(true)
      setError(undefined)

      try {
        const nextPatchVersions = await directStatsProvider.listAvailablePatchVersions()

        if (!isCancelled) {
          setPatchVersions(nextPatchVersions)
        }
      } catch (caughtError) {
        if (!isCancelled) {
          setError(caughtError instanceof Error ? caughtError.message : 'Unable to load patch versions.')
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadPatchVersions()

    return () => {
      isCancelled = true
    }
  }, [])

  return {
    patchVersions,
    isLoading,
    error,
  }
}
