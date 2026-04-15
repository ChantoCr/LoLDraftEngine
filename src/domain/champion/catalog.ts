import type { Role } from '@/domain/champion/types'
import type { ChampionRecord, PatchDataBundle } from '@/domain/stats/types'

export interface ChampionCatalogEntry {
  id: string
  name: string
  roles: Role[]
}

export function createChampionCatalogEntry(
  id: string,
  name: string,
  roles: Role[] = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'],
): ChampionCatalogEntry {
  return {
    id,
    name,
    roles,
  }
}

export function buildChampionCatalogFromStatsBundle(
  bundle: PatchDataBundle,
  fallbackRolesByChampionId: Partial<Record<string, Role[]>> = {},
) {
  return bundle.champions.map((champion: ChampionRecord) =>
    createChampionCatalogEntry(champion.id, champion.name, fallbackRolesByChampionId[champion.id] ?? []),
  )
}
