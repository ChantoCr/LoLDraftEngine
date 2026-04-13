import type { Role } from '@/domain/champion/types'

export type ChampionPoolTier = 'MAIN' | 'COMFORT' | 'PLAYABLE' | 'EMERGENCY'

export interface ChampionPoolEntry {
  championId: string
  tier: ChampionPoolTier
  masteryConfidence: number
}

export interface ChampionPoolProfile {
  playerLabel: string
  role: Role
  entries: ChampionPoolEntry[]
}
