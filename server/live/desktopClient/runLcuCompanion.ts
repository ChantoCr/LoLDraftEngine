import { loadDesktopChampionCatalog } from '@server/live/desktopClient/championCatalog'
import { createLcuPollingDraftSource } from '@server/live/desktopClient/lcuAdapter'
import { discoverLcuConnectionCredentials } from '@server/live/desktopClient/lcuLockfile'
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
  const requestedPatchVersion = resolveArgument(3, 'DESKTOP_COMPANION_PATCH_VERSION') ?? 'latest'
  const lockfilePath = resolveArgument(4, 'LCU_LOCKFILE_PATH')
  const baseUrl = process.env.LIVE_BACKEND_BASE_URL ?? 'http://localhost:3001'
  const companionToken = process.env.DESKTOP_COMPANION_TOKEN
  const pollIntervalMs = Number(process.env.DESKTOP_COMPANION_POLL_MS ?? 1500)
  const heartbeatIntervalMs = Number(process.env.DESKTOP_COMPANION_HEARTBEAT_MS ?? 5000)

  if (!sessionId) {
    throw new Error('Provide DESKTOP_SESSION_ID or pass the desktop session id as the first argument.')
  }

  const lockfileDescriptor = await discoverLcuConnectionCredentials({ lockfilePath })
  const { resolvedPatchVersion, championCatalog } = await loadDesktopChampionCatalog(requestedPatchVersion)
  const source = createLcuPollingDraftSource({
    credentials: lockfileDescriptor.credentials,
    patchVersion: resolvedPatchVersion,
    championCatalog,
  })

  const runtime = startDesktopCompanionRuntime({
    sessionId,
    source,
    baseUrl,
    companionToken,
    pollIntervalMs,
    heartbeatIntervalMs,
    logger: (message) => console.log(message),
  })

  registerShutdown(() => runtime.stop())
  console.log(
    `Desktop LCU companion started for session ${sessionId}. Lockfile: ${lockfileDescriptor.lockfilePath}. Patch: ${resolvedPatchVersion}.`,
  )
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
