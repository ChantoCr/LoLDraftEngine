import { createDDragonStatsProvider } from '@/data/providers/dDragon/service'
import type { ChampionRecord } from '@/domain/stats/types'
import type { DesktopChampionCatalogEntry } from '@server/live/desktopClient/source'

export function buildDesktopChampionCatalogFromPatchBundle(
  champions: Array<Pick<ChampionRecord, 'id' | 'key' | 'recommendedRoles' | 'classes'>>,
): DesktopChampionCatalogEntry[] {
  return champions.flatMap((champion) => {
    const riotChampionId = Number(champion.key)

    if (!Number.isInteger(riotChampionId) || riotChampionId <= 0) {
      return []
    }

    return {
      championId: champion.id,
      riotChampionId,
      recommendedRoles: champion.recommendedRoles,
      classes: champion.classes,
    }
  })
}

export async function loadDesktopChampionCatalog(patchVersion: string) {
  const provider = createDDragonStatsProvider()
  const bundle = await provider.loadPatchDataBundle({ patchVersion })

  return {
    resolvedPatchVersion: bundle.patchVersion,
    championCatalog: buildDesktopChampionCatalogFromPatchBundle(bundle.champions),
  }
}
