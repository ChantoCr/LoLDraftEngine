import type { ConfidenceLevel, ScoreValue } from '@/domain/common/types'
import type { RecommendationMode } from '@/domain/draft/types'

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

export type RecommendationReasonType = 'SYNERGY' | 'COUNTER' | 'REPAIR' | 'RISK' | 'POOL' | 'META'

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

export interface RecommendationCandidate {
  championId: string
  championName: string
  recommendationMode: RecommendationMode
  tags: string[]
  breakdown: RecommendationBreakdown
}
