import type { ConfidenceLevel, PatchVersion } from '@/domain/common/types'
import type {
  ChampionRecord,
  ConfidenceIndicator,
  DataFreshness,
  MatchupSignal,
  MetaSignal,
  PatchDataBundle,
  StatsSource,
  SynergySignal,
} from '@/domain/stats/types'

interface CreateConfidenceIndicatorInput {
  score: number
  reasons?: string[]
}

interface CreateDataFreshnessInput {
  source: StatsSource
  patchVersion: PatchVersion
  fetchedAt?: string
  expiresAt?: string
}

interface CreatePatchDataBundleInput {
  patchVersion: PatchVersion
  champions?: ChampionRecord[]
  matchupSignals?: MatchupSignal[]
  synergySignals?: SynergySignal[]
  metaSignals?: MetaSignal[]
  freshness?: DataFreshness[]
}

function toConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= 0.8) {
    return 'high'
  }

  if (score >= 0.55) {
    return 'medium'
  }

  return 'low'
}

export function createConfidenceIndicator({ score, reasons = [] }: CreateConfidenceIndicatorInput): ConfidenceIndicator {
  return {
    level: toConfidenceLevel(score),
    score,
    reasons,
  }
}

export function createDataFreshness({
  source,
  patchVersion,
  fetchedAt = new Date().toISOString(),
  expiresAt,
}: CreateDataFreshnessInput): DataFreshness {
  return {
    source,
    patchVersion,
    fetchedAt,
    expiresAt,
    isStale: Boolean(expiresAt && Date.parse(expiresAt) <= Date.parse(fetchedAt)),
  }
}

export function createPatchDataBundle({
  patchVersion,
  champions = [],
  matchupSignals = [],
  synergySignals = [],
  metaSignals = [],
  freshness = champions.map((champion) => champion.freshness),
}: CreatePatchDataBundleInput): PatchDataBundle {

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
    freshness,
  }
}
