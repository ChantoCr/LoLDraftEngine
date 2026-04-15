import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import type { Request, Response } from 'express'
import type { DesktopClientIngestAck, DesktopClientIngestRequest } from '@server/live/desktopClient/types'
import { InMemoryLiveSessionStore } from '@server/live/sessionStore'
import { DesktopClientBridge } from '@server/live/desktopClient/bridge'

interface CreateDesktopClientRouterInput {
  sessionStore: InMemoryLiveSessionStore
  bridge: DesktopClientBridge
  companionToken?: string
}

function isAuthorizedDesktopCompanionRequest(request: Request, companionToken?: string) {
  if (!companionToken) {
    return true
  }

  return request.get('x-desktop-companion-token') === companionToken
}

export function createDesktopClientRouter({ sessionStore, bridge, companionToken }: CreateDesktopClientRouterInput) {
  const router = Router()

  router.post('/session/:sessionId/ingest', (request: Request, response: Response) => {
    if (!isAuthorizedDesktopCompanionRequest(request, companionToken)) {
      response.status(401).json({
        message: 'Desktop companion ingest is not authorized for this backend.',
      })
      return
    }

    const sessionId = String(request.params.sessionId)
    const session = sessionStore.get(sessionId)

    if (!session || session.source !== 'DESKTOP_CLIENT') {
      response.status(404).json({
        message: 'Desktop-client live session was not found.',
      })
      return
    }

    const payload = request.body as DesktopClientIngestRequest

    if (!payload.session && !payload.draftState && !payload.heartbeat) {
      response.status(400).json({
        message: 'Desktop-client ingest requires a heartbeat, session update, or draft state payload.',
      })
      return
    }

    const acceptedEvents: DesktopClientIngestAck['acceptedEvents'] = []
    let listenerNotifications = 0
    const companionInstanceId = payload.metadata?.companionInstanceId ?? payload.heartbeat?.companionInstanceId

    if (payload.heartbeat) {
      const heartbeatMessage =
        payload.heartbeat.message ??
        `Desktop companion heartbeat received${companionInstanceId ? ` from ${companionInstanceId}` : ''}.`

      sessionStore.update(sessionId, {
        status: session.status === 'error' ? 'connecting' : session.status,
        message: heartbeatMessage,
        lastHeartbeatAt: payload.heartbeat.observedAt ?? new Date().toISOString(),
        companionInstanceId,
        lastIngestEventId: payload.metadata?.eventId,
        updatedAt: new Date().toISOString(),
      })

      listenerNotifications += bridge.emit(sessionId, {
        type: 'session-update',
        session: {
          status: session.status === 'error' ? 'connecting' : session.status,
          message: heartbeatMessage,
        },
      })
      acceptedEvents.push('heartbeat')
    }

    if (payload.session) {
      sessionStore.update(sessionId, {
        status: payload.session.status ?? session.status,
        message: payload.session.message ?? session.message,
        companionInstanceId,
        lastIngestEventId: payload.metadata?.eventId,
        updatedAt: new Date().toISOString(),
      })

      listenerNotifications += bridge.emit(sessionId, {
        type: 'session-update',
        session: payload.session,
      })
      acceptedEvents.push('session-update')
    }

    if (payload.draftState) {
      sessionStore.update(sessionId, {
        status: 'connected',
        companionInstanceId,
        lastIngestEventId: payload.metadata?.eventId,
        updatedAt: new Date().toISOString(),
      })

      listenerNotifications += bridge.emit(sessionId, {
        type: 'draft-state',
        draftState: payload.draftState,
      })
      acceptedEvents.push('draft-state')
    }

    response.json({
      ok: true,
      sessionId,
      ackId: randomUUID(),
      receivedAt: new Date().toISOString(),
      acceptedEvents,
      listenerNotifications,
    } satisfies DesktopClientIngestAck)
  })

  return router
}
