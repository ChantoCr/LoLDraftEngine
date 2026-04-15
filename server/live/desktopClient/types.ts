import type { DraftState } from '@/domain/draft/types'
import type { LiveDraftConnectionStatus, LiveDraftSession } from '@/domain/live/types'

export interface DesktopClientSessionUpdatePayload {
  status?: Extract<LiveDraftConnectionStatus, 'connecting' | 'connected' | 'error'>
  message?: string
}

export interface DesktopClientIngestMetadata {
  eventId?: string
  sentAt?: string
  source?: 'desktop-companion' | 'mock-desktop-companion'
  companionInstanceId?: string
  sequenceNumber?: number
  deliveryAttempt?: number
}

export interface DesktopClientHeartbeatPayload {
  observedAt?: string
  message?: string
  companionInstanceId?: string
}

export interface DesktopClientIngestRequest {
  metadata?: DesktopClientIngestMetadata
  heartbeat?: DesktopClientHeartbeatPayload
  session?: Partial<LiveDraftSession>
  draftState?: DraftState
}

export interface DesktopClientIngestAck {
  ok: true
  sessionId: string
  ackId: string
  receivedAt: string
  acceptedEvents: Array<'session-update' | 'draft-state' | 'heartbeat'>
  listenerNotifications: number
}
