import type { DraftState } from '@/domain/draft/types'
import type { BackendLiveDraftEvent, BackendLiveDraftSource } from '@/data/providers/live/backendApi/types'
import type { LiveDraftConnectionStatus, LiveSnapshotDebugInfo, RiotLookupDebugInfo, SummonerIdentity } from '@/domain/live/types'

export interface LiveSessionRecord {
  id: string
  source: BackendLiveDraftSource
  player: SummonerIdentity
  status: LiveDraftConnectionStatus
  message?: string
  createdAt: string
  updatedAt: string
  lastHeartbeatAt?: string
  companionInstanceId?: string
  lastIngestEventId?: string
  lastIngestSequenceNumber?: number
  snapshotDebug?: LiveSnapshotDebugInfo
  riotLookupDebug?: RiotLookupDebugInfo
}

export interface RecognizedLiveSession {
  status: Extract<LiveDraftConnectionStatus, 'connecting' | 'connected' | 'error'>
  message?: string
  initialDraftState?: DraftState
  snapshotDebug?: LiveSnapshotDebugInfo
  riotLookupDebug?: RiotLookupDebugInfo
}

export interface BackendLiveDraftAdapter {
  source: BackendLiveDraftSource
  recognizePlayer(identity: SummonerIdentity): Promise<RecognizedLiveSession>
  subscribe(
    session: LiveSessionRecord,
    emitEvent: (event: BackendLiveDraftEvent) => void,
  ): Promise<() => void>
}

export interface DraftStateEvent {
  type: 'draft-state'
  draftState: DraftState
}
