import type { Role } from '@/domain/champion/types'
import type { PatchVersion } from '@/domain/common/types'
import type { StatsSource } from '@/domain/stats/types'

export interface ExternalChampionMetaEntry {
  championId: string
  role: Role
  pickRate?: number
  winRate?: number
  banRate?: number
  sampleSize?: number
  tier?: 'S' | 'A' | 'B' | 'C' | 'D'
  confidenceScore?: number
  confidenceReasons?: string[]
}

export interface ExternalMatchupEntry {
  championId: string
  role: Role
  opponentChampionId: string
  deltaWinRate?: number
  lanePressure?: number
  sampleSize?: number
  confidenceScore?: number
  confidenceReasons?: string[]
}

export interface ExternalSynergyEntry {
  championId: string
  allyChampionId: string
  roles?: Role[]
  synergyScore: number
  sampleSize?: number
  confidenceScore?: number
  confidenceReasons?: string[]
}

export interface ExternalPatchStatsPayload {
  patchVersion: PatchVersion
  source: StatsSource
  sourceVersion: string
  fetchedAt: string
  expiresAt?: string
  championMeta: ExternalChampionMetaEntry[]
  matchupSignals: ExternalMatchupEntry[]
  synergySignals: ExternalSynergyEntry[]
}
