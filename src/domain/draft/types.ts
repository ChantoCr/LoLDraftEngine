import type { PatchVersion } from '@/domain/common/types'
import type { Role } from '@/domain/champion/types'

export type TeamSide = 'ALLY' | 'ENEMY'
export type ProductMode = 'SOLO_QUEUE' | 'COMPETITIVE' | 'CLASH'
export type RecommendationMode = 'BEST_OVERALL' | 'PERSONAL_POOL'

export interface DraftSlot {
  role: Role
  championId?: string
  isLocked: boolean
}

export interface TeamDraft {
  side: TeamSide
  picks: DraftSlot[]
  bans: string[]
}

export interface DraftState {
  patchVersion: PatchVersion
  productMode: ProductMode
  recommendationMode: RecommendationMode
  currentPickRole: Role
  allyTeam: TeamDraft
  enemyTeam: TeamDraft
  availableChampionIds: string[]
}
