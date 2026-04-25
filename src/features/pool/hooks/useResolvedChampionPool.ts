import { useEffect, useState } from 'react'
import { resolveRiotChampionPoolProfile } from '@/data/api/playerPool'
import type { ChampionPoolProfile } from '@/domain/champion-pool/types'
import type { Role } from '@/domain/champion/types'
import type { SummonerIdentity } from '@/domain/live/types'

interface UseResolvedChampionPoolResult {
  championPool?: ChampionPoolProfile
  isLoading: boolean
  error?: string
}

export function useResolvedChampionPool({
  identity,
  role,
  patchVersion,
  enabled,
  fallbackPool,
}: {
  identity?: SummonerIdentity
  role: Role
  patchVersion: string
  enabled: boolean
  fallbackPool?: ChampionPoolProfile
}): UseResolvedChampionPoolResult {
  const [championPool, setChampionPool] = useState<ChampionPoolProfile | undefined>(fallbackPool)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!enabled || !identity) {
      setChampionPool(fallbackPool)
      setError(undefined)
      setIsLoading(false)
      return
    }

    const resolvedIdentity = identity
    let isCancelled = false

    async function loadChampionPool() {
      setIsLoading(true)
      setError(undefined)

      try {
        const nextPool = await resolveRiotChampionPoolProfile({
          identity: resolvedIdentity,
          role,
          patchVersion,
        })

        if (!isCancelled) {
          setChampionPool(nextPool)
        }
      } catch (caughtError) {
        if (!isCancelled) {
          const baseError = caughtError instanceof Error ? caughtError.message : 'Unable to resolve Riot champion pool.'
          setChampionPool(fallbackPool)
          setError(fallbackPool ? `${baseError} Using the current fallback pool for this role.` : baseError)
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadChampionPool()

    return () => {
      isCancelled = true
    }
  }, [enabled, fallbackPool, identity, patchVersion, role])

  return {
    championPool,
    isLoading,
    error,
  }
}
