import type { ChampionClass, Role } from '@/domain/champion/types'
import type { ConfidenceLevel, PatchVersion } from '@/domain/common/types'

export type StatsSource = 'DDRAGON' | 'RIOT_API' | 'THIRD_PARTY' | 'FIXTURE'

export interface ConfidenceIndicator {
  level: ConfidenceLevel
  score: number
  reasons: string[]
}

export interface DataFreshness {
  source: StatsSource
  patchVersion: PatchVersion
  fetchedAt: string
  expiresAt?: string
  isStale: boolean
}

export interface ChampionKitRatings {
  attack: number
  defense: number
  magic: number
  difficulty: number
}

export interface ChampionBaseStats {
  hp: number
  hpPerLevel: number
  mp: number
  mpPerLevel: number
  armor: number
  armorPerLevel: number
  moveSpeed: number
}

export interface ChampionImageAssets {
  square: string
  loading?: string
  splash?: string
}

export interface ChampionRolePerformance {
  role: Role
  pickRate?: number
  winRate?: number
  banRate?: number
  sampleSize?: number
  confidence: ConfidenceIndicator
}

export interface ChampionRecord {
  id: string
  key: string
  name: string
  title: string
  patchVersion: PatchVersion
  source: StatsSource
  sourceVersion: string
  classes: ChampionClass[]
  recommendedRoles: Role[]
  resource: string
  image: ChampionImageAssets
  kitRatings: ChampionKitRatings
  baseStats: ChampionBaseStats
  rolePerformances: ChampionRolePerformance[]
  freshness: DataFreshness
}

export interface MatchupSignal {
  patchVersion: PatchVersion
  source: StatsSource
  championId: string
  role: Role
  opponentChampionId: string
  deltaWinRate?: number
  lanePressure?: number
  confidence: ConfidenceIndicator
}

export interface SynergySignal {
  patchVersion: PatchVersion
  source: StatsSource
  championId: string
  allyChampionId: string
  roles?: Role[]
  synergyScore: number
  confidence: ConfidenceIndicator
}

export interface MetaSignal {
  patchVersion: PatchVersion
  source: StatsSource
  championId: string
  role: Role
  pickRate?: number
  winRate?: number
  banRate?: number
  tier?: 'S' | 'A' | 'B' | 'C' | 'D'
  confidence: ConfidenceIndicator
}

export interface PatchDataBundle {
  patchVersion: PatchVersion
  champions: ChampionRecord[]
  championsById: Record<string, ChampionRecord>
  matchupSignals: MatchupSignal[]
  synergySignals: SynergySignal[]
  metaSignals: MetaSignal[]
  freshness: DataFreshness[]
}
