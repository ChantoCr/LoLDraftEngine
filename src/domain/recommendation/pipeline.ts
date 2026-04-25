import { recommendBuildForChampion } from '@/domain/build/engine'
import { defaultChampionBuildProfileRegistry } from '@/domain/build/profileRegistry'
import type { ChampionBuildProfileRegistry } from '@/domain/build/types'
import type { ChampionPoolProfile } from '@/domain/champion-pool/types'
import type { Champion } from '@/domain/champion/types'
import type { DraftState, RecommendationMode } from '@/domain/draft/types'
import { buildRecommendationScenarioForChampion, recommendChampionsForDraft } from '@/domain/recommendation/engine'
import type { RecommendationPackage } from '@/domain/recommendation/types'
import type { PatchDataBundle } from '@/domain/stats/types'

interface BuildRecommendationPackagesInput {
  draftState: DraftState
  championsById: Record<string, Champion>
  recommendationMode: RecommendationMode
  championPool?: ChampionPoolProfile
  statsBundle?: PatchDataBundle
  topN?: number
  buildTopN?: number
  buildRegistry?: ChampionBuildProfileRegistry
}

interface BuildRecommendationPipelineInput {
  draftState: DraftState
  championsById: Record<string, Champion>
  championPool?: ChampionPoolProfile
  statsBundle?: PatchDataBundle
  topN?: number
  buildTopN?: number
  buildRegistry?: ChampionBuildProfileRegistry
}

export interface RecommendationPipelineResult {
  bestOverall: RecommendationPackage[]
  personalPool: RecommendationPackage[]
}

export function buildRecommendationPackages({
  draftState,
  championsById,
  recommendationMode,
  championPool,
  statsBundle,
  topN = 5,
  buildTopN = topN,
  buildRegistry = defaultChampionBuildProfileRegistry,
}: BuildRecommendationPackagesInput): RecommendationPackage[] {
  const recommendations = recommendChampionsForDraft({
    draftState,
    championsById,
    recommendationMode,
    championPool,
    statsBundle,
    topN,
  })

  return recommendations.map((candidate, index) => {
    const champion = championsById[candidate.championId]

    if (!champion || index >= buildTopN) {
      return { candidate }
    }

    const scenario = buildRecommendationScenarioForChampion(champion, {
      draftState,
      championsById,
    })
    const buildProfile = buildRegistry.getProfile({
      championId: champion.id,
      role: draftState.currentPickRole,
      patchVersion: draftState.patchVersion,
      champion,
    })

    return {
      candidate,
      build: recommendBuildForChampion({
        recommendation: candidate,
        scenario,
        champion,
        buildProfile,
      }),
    }
  })
}

export function buildRecommendationPipeline({
  draftState,
  championsById,
  championPool,
  statsBundle,
  topN = 5,
  buildTopN = topN,
  buildRegistry = defaultChampionBuildProfileRegistry,
}: BuildRecommendationPipelineInput): RecommendationPipelineResult {
  return {
    bestOverall: buildRecommendationPackages({
      draftState,
      championsById,
      recommendationMode: 'BEST_OVERALL',
      championPool,
      statsBundle,
      topN,
      buildTopN,
      buildRegistry,
    }),
    personalPool: buildRecommendationPackages({
      draftState,
      championsById,
      recommendationMode: 'PERSONAL_POOL',
      championPool,
      statsBundle,
      topN,
      buildTopN,
      buildRegistry,
    }),
  }
}
