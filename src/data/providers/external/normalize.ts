import { createConfidenceIndicator, createDataFreshness } from '@/domain/stats/factories'
import type { PatchDataBundle } from '@/domain/stats/types'
import { createPatchDataBundle } from '@/domain/stats/factories'
import type { ExternalPatchStatsPayload } from '@/data/providers/external/types'

export function normalizeExternalPatchStatsPayload(payload: ExternalPatchStatsPayload): PatchDataBundle {
  const freshness = createDataFreshness({
    source: payload.source,
    patchVersion: payload.patchVersion,
    fetchedAt: payload.fetchedAt,
    expiresAt: payload.expiresAt,
  })

  return createPatchDataBundle({
    patchVersion: payload.patchVersion,
    metaSignals: payload.championMeta.map((entry) => ({
      patchVersion: payload.patchVersion,
      source: payload.source,
      championId: entry.championId,
      role: entry.role,
      pickRate: entry.pickRate,
      winRate: entry.winRate,
      banRate: entry.banRate,
      tier: entry.tier,
      confidence: createConfidenceIndicator({
        score: entry.confidenceScore ?? (entry.sampleSize && entry.sampleSize >= 1000 ? 0.85 : 0.6),
        reasons: entry.confidenceReasons ?? [],
      }),
    })),
    matchupSignals: payload.matchupSignals.map((entry) => ({
      patchVersion: payload.patchVersion,
      source: payload.source,
      championId: entry.championId,
      role: entry.role,
      opponentChampionId: entry.opponentChampionId,
      deltaWinRate: entry.deltaWinRate,
      lanePressure: entry.lanePressure,
      confidence: createConfidenceIndicator({
        score: entry.confidenceScore ?? (entry.sampleSize && entry.sampleSize >= 800 ? 0.8 : 0.55),
        reasons: entry.confidenceReasons ?? [],
      }),
    })),
    synergySignals: payload.synergySignals.map((entry) => ({
      patchVersion: payload.patchVersion,
      source: payload.source,
      championId: entry.championId,
      allyChampionId: entry.allyChampionId,
      roles: entry.roles,
      synergyScore: entry.synergyScore,
      confidence: createConfidenceIndicator({
        score: entry.confidenceScore ?? (entry.sampleSize && entry.sampleSize >= 800 ? 0.78 : 0.55),
        reasons: entry.confidenceReasons ?? [],
      }),
    })),
    freshness: [freshness],
  })
}
