import { loadProjectEnv } from '@server/config/loadEnv'

export interface ServerConfig {
  port: number
  corsOrigin: string
  riotApiKey?: string
  externalStatsUrl?: string
  desktopCompanionToken?: string
}

export function getServerConfig(): ServerConfig {
  loadProjectEnv()

  return {
    port: Number(process.env.PORT ?? 3001),
    corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    riotApiKey: process.env.RIOT_API_KEY,
    externalStatsUrl: process.env.EXTERNAL_STATS_URL,
    desktopCompanionToken: process.env.DESKTOP_COMPANION_TOKEN,
  }
}
