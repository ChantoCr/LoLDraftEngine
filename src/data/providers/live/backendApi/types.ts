import type { DraftState } from '@/domain/draft/types'
import type {
  LiveDraftConnectionStatus,
  LiveDraftSession,
  LiveSnapshotDebugInfo,
  RiotLookupDebugInfo,
  RiotRegion,
  SummonerIdentity,
} from '@/domain/live/types'

export type BackendLiveDraftSource = 'MOCK' | 'RIOT_API' | 'DESKTOP_CLIENT'

export interface RecognizePlayerRequest {
  identity?: Partial<SummonerIdentity>
  source: BackendLiveDraftSource
}

export interface RecognizePlayerResponse {
  sessionId: string
  player: SummonerIdentity
  status: Extract<LiveDraftConnectionStatus, 'connecting' | 'connected' | 'error'>
  syncMode: BackendLiveDraftSource
  message?: string
  lastSyncAt?: string
  region: RiotRegion
  initialDraftState?: DraftState
  snapshotDebug?: LiveSnapshotDebugInfo
  riotLookupDebug?: RiotLookupDebugInfo
  lastHeartbeatAt?: string
  companionInstanceId?: string
  lastIngestEventId?: string
  lastIngestSequenceNumber?: number
}

export interface TriggerDesktopMockSequenceResponse {
  ok: true
  emittedStates: number
}

export interface SubscribeToDraftInput {
  sessionId: string
  source: BackendLiveDraftSource
  onDraftState: (draftState: DraftState) => void
  onSessionUpdate?: (session: Partial<LiveDraftSession>) => void
  onError?: (error: Error) => void
}

export interface BackendDraftStateEvent {
  type: 'draft-state'
  draftState: DraftState
}

export interface BackendSessionUpdateEvent {
  type: 'session-update'
  session: Partial<LiveDraftSession>
}

export type BackendLiveDraftEvent = BackendDraftStateEvent | BackendSessionUpdateEvent
