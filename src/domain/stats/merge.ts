import type {
  ChampionRecord,
  ChampionRolePerformance,
  MatchupSignal,
  MetaSignal,
  PatchDataBundle,
  SynergySignal,
} from '@/domain/stats/types'

function mergeRolePerformances(
  currentRolePerformances: ChampionRolePerformance[],
  metaSignals: MetaSignal[],
): ChampionRolePerformance[] {
  const byRole = new Map(currentRolePerformances.map((entry) => [entry.role, entry]))

  for (const signal of metaSignals) {
    byRole.set(signal.role, {
      role: signal.role,
      pickRate: signal.pickRate,
      winRate: signal.winRate,
      banRate: signal.banRate,
      confidence: signal.confidence,
    })
  }

  return [...byRole.values()]
}

function mergeChampions(championBundles: PatchDataBundle[]) {
  const championsById = new Map<string, ChampionRecord>()

  for (const bundle of championBundles) {
    for (const champion of bundle.champions) {
      const existingChampion = championsById.get(champion.id)
      const championMetaSignals = bundle.metaSignals.filter((signal) => signal.championId === champion.id)

      championsById.set(champion.id, {
        ...(existingChampion ?? champion),
        ...champion,
        rolePerformances: mergeRolePerformances(
          existingChampion?.rolePerformances ?? champion.rolePerformances,
          championMetaSignals,
        ),
      })
    }
  }

  return [...championsById.values()].sort((left, right) => left.name.localeCompare(right.name))
}

function dedupeSignals<TSignal extends MatchupSignal | MetaSignal | SynergySignal>(
  signals: TSignal[],
  getKey: (signal: TSignal) => string,
) {
  const byKey = new Map<string, TSignal>()

  for (const signal of signals) {
    byKey.set(getKey(signal), signal)
  }

  return [...byKey.values()]
}

export function mergePatchDataBundles(...bundles: PatchDataBundle[]): PatchDataBundle {
  const patchVersion = bundles[0]?.patchVersion ?? 'unknown'
  const champions = mergeChampions(bundles)
  const metaSignals = dedupeSignals(
    bundles.flatMap((bundle) => bundle.metaSignals),
    (signal) => `${signal.championId}:${signal.role}`,
  )
  const matchupSignals = dedupeSignals(
    bundles.flatMap((bundle) => bundle.matchupSignals),
    (signal) => `${signal.championId}:${signal.role}:${signal.opponentChampionId}`,
  )
  const synergySignals = dedupeSignals(
    bundles.flatMap((bundle) => bundle.synergySignals),
    (signal) => `${signal.championId}:${signal.allyChampionId}:${(signal.roles ?? []).join('|')}`,
  )

  for (const champion of champions) {
    const championMetaSignals = metaSignals.filter((signal) => signal.championId === champion.id)
    champion.rolePerformances = mergeRolePerformances(champion.rolePerformances, championMetaSignals)
  }

  return {
    patchVersion,
    champions,
    championsById: champions.reduce<Record<string, ChampionRecord>>((accumulator, champion) => {
      accumulator[champion.id] = champion
      return accumulator
    }, {}),
    matchupSignals,
    synergySignals,
    metaSignals,
    freshness: bundles.flatMap((bundle) => bundle.freshness),
  }
}
