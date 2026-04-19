import type { DraftState } from '@/domain/draft/types'

export type RiotRegion =
  | 'BR'
  | 'EUN'
  | 'EUW'
  | 'JP'
  | 'KR'
  | 'LAN'
  | 'LAS'
  | 'MENA'
  | 'NA'
  | 'OCE'
  | 'PH'
  | 'RU'
  | 'SG'
  | 'TH'
  | 'TR'
  | 'TW'
  | 'VN'
  | 'PBE'

export interface SummonerIdentity {
  gameName: string
  tagLine: string
  region: RiotRegion
}

export type LiveDraftSyncMode = 'MANUAL' | 'MOCK' | 'RIOT_API' | 'DESKTOP_CLIENT'
export type LiveDraftConnectionStatus = 'idle' | 'manual' | 'connecting' | 'connected' | 'error'
export type LiveSnapshotSource = Exclude<LiveDraftSyncMode, 'MANUAL'>
export type RiotLookupStepStatus = 'success' | 'failed' | 'skipped' | 'not-found' | 'not-needed'

export interface LiveSnapshotDebugInfo {
  source: LiveSnapshotSource
  snapshotMapped?: boolean
  lastSnapshotAt?: string
  lastMappingFailureReason?: string
}

export interface RiotLookupStepDebugInfo {
  status: RiotLookupStepStatus
  details?: string
}

export interface RiotLookupDebugInfo {
  source: 'RIOT_API'
  accountLookup: RiotLookupStepDebugInfo
  summonerLookupByPuuid: RiotLookupStepDebugInfo
  summonerLookupByAccountFallback: RiotLookupStepDebugInfo
  summonerLookupByNameFallback: RiotLookupStepDebugInfo
  encryptedSummonerId: RiotLookupStepDebugInfo
  activeGameLookup: RiotLookupStepDebugInfo
}

export interface LiveDebugTimelineEntry {
  timestamp: string
  kind: 'session-update' | 'draft-state' | 'heartbeat' | 'action'
  title: string
  description: string
}

export interface LiveDraftSession {
  sessionId?: string
  player?: SummonerIdentity
  status: LiveDraftConnectionStatus
  syncMode: LiveDraftSyncMode
  lastSyncAt?: string
  message?: string
  initialDraftState?: DraftState
  snapshotDebug?: LiveSnapshotDebugInfo
  riotLookupDebug?: RiotLookupDebugInfo
  lastHeartbeatAt?: string
  companionInstanceId?: string
  lastIngestEventId?: string
  lastIngestSequenceNumber?: number
  debugTimeline?: LiveDebugTimelineEntry[]
}
