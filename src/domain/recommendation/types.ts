import type { ChampionBuildRecommendation } from '@/domain/build/types'
import type { ConfidenceLevel, ScoreValue } from '@/domain/common/types'
import type { CompositionProfile } from '@/domain/composition/types'
import type { DraftContext } from '@/domain/draft-context/types'
import type { DraftState, RecommendationMode } from '@/domain/draft/types'

export type RecommendationDimension =
  | 'allySynergy'
  | 'enemyCounter'
  | 'compRepair'
  | 'damageBalance'
  | 'frontlineImpact'
  | 'engageImpact'
  | 'peelImpact'
  | 'executionFit'
  | 'metaValue'
  | 'comfortFit'
  | 'laneMatchupFit'
  | 'objectiveSetupFit'
  | 'macroPostureFit'

export type RecommendationReasonType =
  | 'SYNERGY'
  | 'COUNTER'
  | 'REPAIR'
  | 'RISK'
  | 'POOL'
  | 'META'
  | 'LANE'
  | 'OBJECTIVE'
  | 'POSTURE'

export interface RecommendationDimensionScore {
  dimension: RecommendationDimension
  score: ScoreValue
  weight: number
  contribution: number
}

export interface RecommendationReason {
  id: string
  type: RecommendationReasonType
  direction: 'pro' | 'con'
  label: string
  explanation: string
  impact: number
}

export interface RecommendationBreakdown {
  totalScore: ScoreValue
  confidence: ConfidenceLevel
  dimensions: RecommendationDimensionScore[]
  reasons: RecommendationReason[]
}

export interface RecommendationNarrative {
  headline: string
  summary: string
  decisionFactors: string[]
}

export interface RecommendationCandidate {
  championId: string
  championName: string
  recommendationMode: RecommendationMode
  tags: string[]
  breakdown: RecommendationBreakdown
  narrative: RecommendationNarrative
}

export interface RecommendationScenario {
  simulatedDraftState: DraftState
  allyProfile: CompositionProfile
  enemyProfile: CompositionProfile
  draftContext: DraftContext
}

export interface RecommendationPackage {
  candidate: RecommendationCandidate
  build?: ChampionBuildRecommendation
}
