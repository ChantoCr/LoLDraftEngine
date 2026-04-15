import type { PatchDataBundle } from '@/domain/stats/types'
import type { ChampionCatalogEntry } from '@/domain/champion/catalog'
import { fetchJson } from '@/data/api/fetchJson'

export function fetchPatchStatsBundle(patchVersion: string) {
  return fetchJson<PatchDataBundle>(`/api/stats/patch/${encodeURIComponent(patchVersion)}/bundle`)
}

export function fetchChampionCatalog(patchVersion: string) {
  return fetchJson<ChampionCatalogEntry[]>(`/api/stats/patch/${encodeURIComponent(patchVersion)}/catalog`)
}
