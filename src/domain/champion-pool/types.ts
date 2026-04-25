import type { Role } from '@/domain/champion/types'

export type ChampionPoolTier = 'MAIN' | 'COMFORT' | 'PLAYABLE' | 'EMERGENCY'

export interface ChampionPoolEntry {
  championId: string
  tier: ChampionPoolTier
  masteryConfidence: number
}

export type ChampionPoolSource = 'MANUAL' | 'RIOT_API'
export type ChampionPoolAdviceDecision = 'TAKE_BEST_POOL' | 'STRETCH_FOR_BEST_OVERALL' | 'POOL_GAP_WARNING'

export interface ChampionPoolProfile {
  playerLabel: string
  role: Role
  entries: ChampionPoolEntry[]
  source?: ChampionPoolSource
}

export interface ChampionPoolAdvice {
  role: Role
  bestOverallChampionId?: string
  bestPoolChampionId?: string
  decision: ChampionPoolAdviceDecision
  rationale: string[]
  coverageGaps: string[]
  strategicGapScore: number
}
