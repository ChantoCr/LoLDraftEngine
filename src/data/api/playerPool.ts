import type { ChampionPoolProfile } from '@/domain/champion-pool/types'
import type { Role } from '@/domain/champion/types'
import type { SummonerIdentity } from '@/domain/live/types'

interface ResolveRiotChampionPoolResponse {
  poolProfile: ChampionPoolProfile
}

export async function resolveRiotChampionPoolProfile({
  identity,
  role,
  patchVersion,
  limit = 8,
}: {
  identity: SummonerIdentity
  role: Role
  patchVersion: string
  limit?: number
}): Promise<ChampionPoolProfile> {
  const response = await fetch('/api/player-pool/riot/resolve', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      identity,
      role,
      patchVersion,
      limit,
    }),
  })

  if (!response.ok) {
    const bodyText = (await response.text()).trim()
    throw new Error(bodyText || `Unable to resolve Riot champion pool: ${response.status} ${response.statusText}`)
  }

  return ((await response.json()) as ResolveRiotChampionPoolResponse).poolProfile
}
