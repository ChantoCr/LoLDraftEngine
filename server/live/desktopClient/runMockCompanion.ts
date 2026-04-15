import { postMockDesktopCompanionSequence } from '@server/live/desktopClient/mockCompanion'

async function main() {
  const sessionId = process.env.DESKTOP_SESSION_ID ?? process.argv[2]
  const baseUrl = process.env.LIVE_BACKEND_BASE_URL ?? 'http://localhost:3001'
  const delayMs = Number(process.env.DESKTOP_COMPANION_DELAY_MS ?? 500)
  const companionToken = process.env.DESKTOP_COMPANION_TOKEN

  if (!sessionId) {
    throw new Error('Provide DESKTOP_SESSION_ID or pass the desktop session id as the first argument.')
  }

  const acknowledgements = await postMockDesktopCompanionSequence({
    sessionId,
    baseUrl,
    delayMs,
    companionToken,
    logger: (message) => console.log(message),
  })

  console.log(`Mock desktop companion finished. Posted ${acknowledgements.length} payloads.`)
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
