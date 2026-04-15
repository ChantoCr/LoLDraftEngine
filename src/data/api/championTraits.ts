import type { ChampionTraitScaffoldEntry } from '@/domain/champion-traits/types'
import { fetchJson } from '@/data/api/fetchJson'

export function fetchChampionTraitScaffold(patchVersion: string) {
  return fetchJson<ChampionTraitScaffoldEntry[]>(
    `/api/champion-traits/patch/${encodeURIComponent(patchVersion)}/scaffold`,
  )
}
