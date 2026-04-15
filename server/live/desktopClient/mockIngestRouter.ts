import { Router } from 'express'
import type { Request, Response } from 'express'
import { mockLiveDraftTimeline } from '@/data/mock/liveDraft'
import { DesktopClientBridge } from '@server/live/desktopClient/bridge'
import { InMemoryLiveSessionStore } from '@server/live/sessionStore'

interface CreateDesktopClientMockIngestRouterInput {
  sessionStore: InMemoryLiveSessionStore
  bridge: DesktopClientBridge
}

export function createDesktopClientMockIngestRouter({
  sessionStore,
  bridge,
}: CreateDesktopClientMockIngestRouterInput) {
  const router = Router()

  router.post('/session/:sessionId/mock-sequence', (request: Request, response: Response) => {
    const sessionId = String(request.params.sessionId)
    const session = sessionStore.get(sessionId)

    if (!session || session.source !== 'DESKTOP_CLIENT') {
      response.status(404).json({
        message: 'Desktop-client live session was not found.',
      })
      return
    }

    bridge.emit(sessionId, {
      type: 'session-update',
      session: {
        status: 'connected',
        message: 'Mock desktop-client bridge sequence started.',
      },
    })

    mockLiveDraftTimeline.forEach((draftState) => {
      bridge.emit(sessionId, {
        type: 'draft-state',
        draftState,
      })
    })

    response.json({
      ok: true,
      emittedStates: mockLiveDraftTimeline.length,
    })
  })

  return router
}
