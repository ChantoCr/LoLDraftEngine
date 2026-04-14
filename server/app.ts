import cors from 'cors'
import express from 'express'
import { getServerConfig } from '@server/config/env'
import { createBackendLiveDraftAdapters } from '@server/live/adapters'
import { createLiveRouter } from '@server/live/router'
import { InMemoryLiveSessionStore } from '@server/live/sessionStore'

export function createServerApp() {
  const app = express()
  const config = getServerConfig()
  const sessionStore = new InMemoryLiveSessionStore()
  const adapters = createBackendLiveDraftAdapters()

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

  return {
    app,
    config,
  }
}
