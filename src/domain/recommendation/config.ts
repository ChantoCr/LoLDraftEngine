import type { ProductMode } from '@/domain/draft/types'
import type { RecommendationDimension } from '@/domain/recommendation/types'

export type RecommendationWeights = Record<RecommendationDimension, number>

export const RECOMMENDATION_WEIGHTS_BY_MODE: Record<ProductMode, RecommendationWeights> = {
  SOLO_QUEUE: {
    allySynergy: 1.1,
    enemyCounter: 1,
    compRepair: 1.3,
    damageBalance: 0.5,
    frontlineImpact: 0.8,
    engageImpact: 0.9,
    peelImpact: 1.1,
    executionFit: 1,
    metaValue: 0.4,
    comfortFit: 0,
    laneMatchupFit: 0.9,
    objectiveSetupFit: 0.7,
    macroPostureFit: 0.75,
  },
  COMPETITIVE: {
    allySynergy: 1.15,
    enemyCounter: 1.15,
    compRepair: 1.2,
    damageBalance: 0.7,
    frontlineImpact: 0.8,
    engageImpact: 1,
    peelImpact: 1,
    executionFit: 0.75,
    metaValue: 0.45,
    comfortFit: 0,
    laneMatchupFit: 1,
    objectiveSetupFit: 0.95,
    macroPostureFit: 1,
  },
  CLASH: {
    allySynergy: 1.1,
    enemyCounter: 1,
    compRepair: 1.2,
    damageBalance: 0.6,
    frontlineImpact: 0.8,
    engageImpact: 0.9,
    peelImpact: 1,
    executionFit: 0.9,
    metaValue: 0.4,
    comfortFit: 0,
    laneMatchupFit: 0.95,
    objectiveSetupFit: 0.85,
    macroPostureFit: 0.9,
  },
}
