import cors from 'cors'
import express from 'express'
import { getServerConfig } from '@server/config/env'
import { createBackendLiveDraftAdapters } from '@server/live/adapters'
import { DesktopClientBridge } from '@server/live/desktopClient/bridge'
import { createDesktopClientMockIngestRouter } from '@server/live/desktopClient/mockIngestRouter'
import { createDesktopClientRouter } from '@server/live/desktopClient/router'
import { createLiveRouter } from '@server/live/router'
import { InMemoryLiveSessionStore } from '@server/live/sessionStore'
import { createChampionTraitsRouter } from '@server/championTraits/router'
import { createStatsRouter } from '@server/stats/router'

export function createServerApp() {
  const app = express()
  const config = getServerConfig()
  const sessionStore = new InMemoryLiveSessionStore()
  const desktopClientBridge = new DesktopClientBridge()
  const adapters = createBackendLiveDraftAdapters({ desktopClientBridge })

  app.use(
    cors({
      origin: config.corsOrigin,
    }),
  )
  app.use(express.json())

  app.get('/api/health', (_request, response) => {
    response.json({
      status: 'ok',
      service: 'loldraftengine-backend',
    })
  })

  app.use('/api/live', createLiveRouter({ adapters, sessionStore }))
  app.use(
    '/api/live/desktop-client',
    createDesktopClientRouter({
      sessionStore,
      bridge: desktopClientBridge,
      companionToken: config.desktopCompanionToken,
    }),
  )
  app.use(
    '/api/live/desktop-client/mock',
    createDesktopClientMockIngestRouter({ sessionStore, bridge: desktopClientBridge }),
  )
  app.use('/api/stats', createStatsRouter({ externalStatsUrl: config.externalStatsUrl }))
  app.use('/api/champion-traits', createChampionTraitsRouter({ externalStatsUrl: config.externalStatsUrl }))

  return {
    app,
    config,
  }
}
