export interface ServerConfig {
  port: number
  corsOrigin: string
}

export function getServerConfig(): ServerConfig {
  return {
    port: Number(process.env.PORT ?? 3001),
    corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  }
}
