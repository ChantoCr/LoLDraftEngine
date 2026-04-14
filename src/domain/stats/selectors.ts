import type { Role } from '@/domain/champion/types'
import type { ChampionRolePerformance, MatchupSignal, MetaSignal, PatchDataBundle, SynergySignal } from '@/domain/stats/types'

export function getChampionRecord(bundle: PatchDataBundle, championId: string) {
  return bundle.championsById[championId]
}

export function getChampionMetaSignal(bundle: PatchDataBundle, championId: string, role: Role): MetaSignal | undefined {
  return bundle.metaSignals.find((signal) => signal.championId === championId && signal.role === role)
}

export function getChampionRolePerformance(
  bundle: PatchDataBundle,
  championId: string,
  role: Role,
): ChampionRolePerformance | undefined {
  return getChampionRecord(bundle, championId)?.rolePerformances.find((entry) => entry.role === role)
}

export function getMatchupSignal(
  bundle: PatchDataBundle,
  championId: string,
  role: Role,
  opponentChampionId: string,
): MatchupSignal | undefined {
  return bundle.matchupSignals.find(
    (signal) =>
      signal.championId === championId &&
      signal.role === role &&
      signal.opponentChampionId === opponentChampionId,
  )
}

export function getSynergySignal(
  bundle: PatchDataBundle,
  championId: string,
  allyChampionId: string,
): SynergySignal | undefined {
  return bundle.synergySignals.find(
    (signal) => signal.championId === championId && signal.allyChampionId === allyChampionId,
  )
}
