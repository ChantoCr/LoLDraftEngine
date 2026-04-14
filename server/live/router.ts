import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import type { Request, Response } from 'express'
import { RIOT_REGIONS } from '@/domain/live/constants'
import type { SummonerIdentity } from '@/domain/live/types'
import type { BackendLiveDraftSource, RecognizePlayerRequest } from '@/data/providers/live/backendApi/types'
import { writeSseComment, writeSseEvent, initializeSse } from '@server/live/sse'
import type { BackendLiveDraftAdapter } from '@server/live/types'
import { InMemoryLiveSessionStore } from '@server/live/sessionStore'

interface CreateLiveRouterInput {
  adapters: Record<BackendLiveDraftSource, BackendLiveDraftAdapter>
  sessionStore: InMemoryLiveSessionStore
}

function isValidIdentity(identity: Partial<SummonerIdentity>): identity is SummonerIdentity {
  return Boolean(
    identity.gameName &&
      identity.tagLine &&
      identity.region &&
      RIOT_REGIONS.includes(identity.region),
  )
}

export function createLiveRouter({ adapters, sessionStore }: CreateLiveRouterInput) {
  const router = Router()

  router.post('/session/recognize', async (request: Request, response: Response) => {
    const body = request.body as Partial<RecognizePlayerRequest>
    const source = body.source
    const identity = body.identity

    if (!source || !adapters[source]) {
      response.status(400).json({
        message: 'Unsupported live draft source.',
      })
      return
    }

    if (!identity || !isValidIdentity(identity)) {
      response.status(400).json({
        message: 'Invalid summoner identity. gameName, tagLine, and region are required.',
      })
      return
    }

    const adapter = adapters[source]
    const recognizedSession = await adapter.recognizePlayer(identity)
    const sessionRecord = sessionStore.create({
      id: randomUUID(),
      source,
      player: identity,
      status: recognizedSession.status,
      message: recognizedSession.message,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    response.json({
      sessionId: sessionRecord.id,
      player: sessionRecord.player,
      status: sessionRecord.status,
      syncMode: sessionRecord.source,
      message: sessionRecord.message,
      lastSyncAt: sessionRecord.updatedAt,
      region: sessionRecord.player.region,
    })
  })

  router.get('/session/:sessionId/events', async (request: Request, response: Response) => {
    const sessionId = String(request.params.sessionId)
    const session = sessionStore.get(sessionId)

    if (!session) {
      response.status(404).json({
        message: 'Live draft session was not found.',
      })
      return
    }

    initializeSse(response)
    writeSseComment(response, 'live draft stream connected')

    const adapter = adapters[session.source]
    const unsubscribe = await adapter.subscribe(session, (event) => {
      if (event.type === 'draft-state') {
        sessionStore.update(session.id, {
          status: 'connected',
          updatedAt: new Date().toISOString(),
        })
      }

      if (event.type === 'session-update') {
        sessionStore.update(session.id, {
          status: event.session.status ?? session.status,
          message: event.session.message ?? session.message,
          updatedAt: new Date().toISOString(),
        })
      }

      writeSseEvent(response, event.type, event)
    })

    request.on('close', () => {
      unsubscribe()
      response.end()
    })
  })

  return router
}
