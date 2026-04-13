import type { ProductMode, RecommendationMode } from '@/domain/draft/types'
import type { Role } from '@/domain/champion/types'

export const ROLE_ORDER: Role[] = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT']

export const PRODUCT_MODE_LABELS: Record<ProductMode, string> = {
  SOLO_QUEUE: 'Solo Queue',
  COMPETITIVE: 'Competitive',
  CLASH: 'Clash / Friends',
}

export const RECOMMENDATION_MODE_LABELS: Record<RecommendationMode, string> = {
  BEST_OVERALL: 'Best Overall',
  PERSONAL_POOL: 'Personal Pool',
}
