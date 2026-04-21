import { loadProjectEnv } from '@server/config/loadEnv'

export interface ServerConfig {
  port: number
  corsOrigin: string
  riotApiKey?: string
  externalStatsUrl?: string
  desktopCompanionToken?: string
}

function normalizeOptionalEnvValue(value: string | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export function getServerConfig(): ServerConfig {
  loadProjectEnv()

  return {
    port: Number(process.env.PORT ?? 3001),
    corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    riotApiKey: normalizeOptionalEnvValue(process.env.RIOT_API_KEY),
    externalStatsUrl: normalizeOptionalEnvValue(process.env.EXTERNAL_STATS_URL),
    desktopCompanionToken: normalizeOptionalEnvValue(process.env.DESKTOP_COMPANION_TOKEN),
  }
}
