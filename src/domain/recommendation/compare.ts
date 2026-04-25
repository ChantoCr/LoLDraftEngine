import type { RecommendationCandidate } from '@/domain/recommendation/types'

export interface RecommendationModeComparison {
  headline: string
  summary: string
  tradeoff?: string
}

export function buildRecommendationModeComparison({
  bestOverall,
  bestPool,
}: {
  bestOverall?: RecommendationCandidate
  bestPool?: RecommendationCandidate
}): RecommendationModeComparison | undefined {
  if (!bestOverall && !bestPool) {
    return undefined
  }

  if (bestOverall && bestPool && bestOverall.championId === bestPool.championId) {
    return {
      headline: `${bestPool.championName} is both the best overall and best current pool pick`,
      summary: 'You are not giving up strategic value by staying inside the pool on this board.',
    }
  }

  if (bestOverall && bestPool) {
    const scoreGap = Math.max(0, bestOverall.breakdown.totalScore - bestPool.breakdown.totalScore)

    return {
      headline: `${bestOverall.championName} is the strongest theoretical pick, while ${bestPool.championName} is the best in-pool answer`,
      summary:
        scoreGap <= 6
          ? 'The strategic gap is small enough that comfort and execution can reasonably justify the in-pool pick.'
          : 'The strategic gap is meaningful, so only stay in-pool if execution confidence clearly outweighs the theory loss.',
      tradeoff: `Current score gap: ${scoreGap} points.`,
    }
  }

  if (bestOverall) {
    return {
      headline: `${bestOverall.championName} is the strongest available theoretical pick`,
      summary: 'No valid in-pool alternative is available for the current role or board state.',
    }
  }

  return {
    headline: `${bestPool!.championName} is the best current pool pick`,
    summary: 'Only a pool-constrained recommendation is currently available.',
  }
}
