import { createJsonFileDraftSource } from '@server/live/desktopClient/fileSource'
import { startDesktopCompanionRuntime } from '@server/live/desktopClient/runtime'

function resolveArgument(index: number, envKey: string) {
  return process.argv[index] ?? process.env[envKey]
}

function registerShutdown(handler: () => Promise<void>) {
  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.on(signal, () => {
      void handler().finally(() => process.exit(0))
    })
  }
}

async function main() {
  const sessionId = resolveArgument(2, 'DESKTOP_SESSION_ID')
  const filePath = resolveArgument(3, 'DESKTOP_COMPANION_SOURCE_FILE')
  const baseUrl = process.env.LIVE_BACKEND_BASE_URL ?? 'http://localhost:3001'
  const companionToken = process.env.DESKTOP_COMPANION_TOKEN
  const pollIntervalMs = Number(process.env.DESKTOP_COMPANION_POLL_MS ?? 1500)
  const heartbeatIntervalMs = Number(process.env.DESKTOP_COMPANION_HEARTBEAT_MS ?? 5000)

  if (!sessionId) {
    throw new Error('Provide DESKTOP_SESSION_ID or pass the desktop session id as the first argument.')
  }

  if (!filePath) {
    throw new Error('Provide DESKTOP_COMPANION_SOURCE_FILE or pass the source json path as the second argument.')
  }

  const runtime = startDesktopCompanionRuntime({
    sessionId,
    source: createJsonFileDraftSource({ filePath }),
    baseUrl,
    companionToken,
    pollIntervalMs,
    heartbeatIntervalMs,
    logger: (message) => console.log(message),
  })

  registerShutdown(() => runtime.stop())
  console.log(`Desktop file companion started for session ${sessionId}. Watching ${filePath}.`)
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
