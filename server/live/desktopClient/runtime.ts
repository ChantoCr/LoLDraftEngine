import type { LiveDraftConnectionStatus } from '@/domain/live/types'
import type { DesktopClientIngestAck, DesktopClientIngestRequest } from '@server/live/desktopClient/types'
import type { DesktopCompanionDraftSource, DesktopCompanionSourceSnapshot } from '@server/live/desktopClient/source'

interface PostDesktopClientIngestInput {
  sessionId: string
  payload: DesktopClientIngestRequest
  baseUrl?: string
  companionToken?: string
  fetcher?: typeof fetch
}

interface PostDesktopClientIngestWithRetryInput extends PostDesktopClientIngestInput {
  retryDelaysMs?: number[]
  onRetry?: (attempt: number, error: Error) => void
}

interface StartDesktopCompanionRuntimeInput {
  sessionId: string
  source: DesktopCompanionDraftSource
  baseUrl?: string
  companionToken?: string
  companionInstanceId?: string
  pollIntervalMs?: number
  heartbeatIntervalMs?: number
  retryDelaysMs?: number[]
  fetcher?: typeof fetch
  now?: () => string
  logger?: (message: string) => void
}

export interface DesktopCompanionRuntime {
  flush(): Promise<void>
  stop(): Promise<void>
}

export function buildDesktopClientIngestUrl(sessionId: string, baseUrl = 'http://localhost:3001') {
  return `${baseUrl.replace(/\/$/, '')}/api/live/desktop-client/session/${encodeURIComponent(sessionId)}/ingest`
}

export function buildDesktopClientIngestHeaders(companionToken?: string) {
  return {
    'Content-Type': 'application/json',
    ...(companionToken ? { 'x-desktop-companion-token': companionToken } : {}),
  }
}

export async function postDesktopClientIngest({
  sessionId,
  payload,
  baseUrl,
  companionToken,
  fetcher = fetch,
}: PostDesktopClientIngestInput): Promise<DesktopClientIngestAck> {
  const response = await fetcher(buildDesktopClientIngestUrl(sessionId, baseUrl), {
    method: 'POST',
    headers: buildDesktopClientIngestHeaders(companionToken),
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Desktop companion ingest failed: ${response.status} ${response.statusText}`)
  }

  return (await response.json()) as DesktopClientIngestAck
}

export async function postDesktopClientIngestWithRetry({
  retryDelaysMs = [0, 250, 1000, 3000],
  onRetry,
  ...input
}: PostDesktopClientIngestWithRetryInput): Promise<DesktopClientIngestAck> {
  let lastError: Error | undefined

  for (const [attemptIndex, delayMs] of retryDelaysMs.entries()) {
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }

    try {
      return await postDesktopClientIngest({
        ...input,
        payload: {
          ...input.payload,
          metadata: {
            ...input.payload.metadata,
            deliveryAttempt: attemptIndex + 1,
          },
        },
      })
    } catch (caughtError) {
      lastError = caughtError instanceof Error ? caughtError : new Error(String(caughtError))
      onRetry?.(attemptIndex + 1, lastError)
    }
  }

  throw lastError ?? new Error('Desktop companion ingest failed after retry exhaustion.')
}

function toSessionStatus(snapshot: DesktopCompanionSourceSnapshot): LiveDraftConnectionStatus {
  return snapshot.status === 'active' ? 'connected' : 'connecting'
}

function buildSessionSignature(status: LiveDraftConnectionStatus, message: string | undefined) {
  return JSON.stringify({ status, message: message ?? '' })
}

export function startDesktopCompanionRuntime({
  sessionId,
  source,
  baseUrl,
  companionToken,
  companionInstanceId = `desktop-companion-${Math.random().toString(36).slice(2, 10)}`,
  pollIntervalMs = 1500,
  heartbeatIntervalMs = 5000,
  retryDelaysMs,
  fetcher = fetch,
  now = () => new Date().toISOString(),
  logger,
}: StartDesktopCompanionRuntimeInput): DesktopCompanionRuntime {
  let stopped = false
  let sequenceNumber = 0
  let lastPostedDraftSignature: string | undefined
  let lastPostedSessionSignature: string | undefined
  let pollTimer: ReturnType<typeof setInterval> | undefined
  let heartbeatTimer: ReturnType<typeof setInterval> | undefined
  let flushQueue = Promise.resolve()

  async function postPayload(payload: DesktopClientIngestRequest) {
    const acknowledgement = await postDesktopClientIngestWithRetry({
      sessionId,
      payload,
      baseUrl,
      companionToken,
      fetcher,
      retryDelaysMs,
      onRetry: (attempt, error) => {
        logger?.(`Desktop companion retry ${attempt} failed: ${error.message}`)
      },
    })

    logger?.(
      `Desktop companion acked ${acknowledgement.acceptedEvents.join(', ')} for session ${acknowledgement.sessionId}.`,
    )
    return acknowledgement
  }

  function createMetadata(eventIdPrefix: string) {
    sequenceNumber += 1

    return {
      eventId: `${eventIdPrefix}-${sequenceNumber}`,
      sentAt: now(),
      source: 'desktop-companion' as const,
      companionInstanceId,
      sequenceNumber,
    }
  }

  async function postSessionUpdateIfChanged(
    status: LiveDraftConnectionStatus,
    message: string | undefined,
    eventIdPrefix: string,
  ) {
    const nextSignature = buildSessionSignature(status, message)

    if (nextSignature === lastPostedSessionSignature) {
      return
    }

    lastPostedSessionSignature = nextSignature

    await postPayload({
      metadata: createMetadata(eventIdPrefix),
      session: {
        status,
        message,
      },
    })
  }

  async function postHeartbeat() {
    if (stopped) {
      return
    }

    await postPayload({
      metadata: createMetadata('heartbeat'),
      heartbeat: {
        observedAt: now(),
        companionInstanceId,
        message: `Desktop companion heartbeat active. Source: ${source.describe()}.`,
      },
    })
  }

  async function performFlush() {
    if (stopped) {
      return
    }

    try {
      const snapshot = await source.readSnapshot()

      if (!snapshot) {
        return
      }

      const sessionStatus = toSessionStatus(snapshot)
      const sessionMessage = snapshot.message ?? `Desktop companion polled ${source.describe()}.`
      const draftState = snapshot.draftState

      if (!draftState) {
        await postSessionUpdateIfChanged(sessionStatus, sessionMessage, 'source-status')
        return
      }

      const nextDraftSignature = JSON.stringify(draftState)

      if (nextDraftSignature === lastPostedDraftSignature) {
        await postSessionUpdateIfChanged(sessionStatus, sessionMessage, 'source-status')
        return
      }

      lastPostedDraftSignature = nextDraftSignature
      lastPostedSessionSignature = buildSessionSignature('connected', sessionMessage)

      await postPayload({
        metadata: createMetadata('draft-state'),
        session: {
          status: 'connected',
          message: sessionMessage,
        },
        draftState,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      await postSessionUpdateIfChanged('error', message, 'source-error')
      throw error
    }
  }

  function flush() {
    flushQueue = flushQueue.then(
      () => performFlush(),
      () => performFlush(),
    )

    return flushQueue
  }

  async function start() {
    await postSessionUpdateIfChanged(
      'connecting',
      `Desktop companion connected. Polling ${source.describe()} for champion-select updates.`,
      'session-connect',
    )

    await postHeartbeat()
    await flush()

    pollTimer = setInterval(() => {
      void flush().catch((error) => {
        logger?.(error instanceof Error ? error.message : String(error))
      })
    }, pollIntervalMs)

    heartbeatTimer = setInterval(() => {
      void postHeartbeat().catch((error) => {
        logger?.(error instanceof Error ? error.message : String(error))
      })
    }, heartbeatIntervalMs)
  }

  void start().catch((error) => {
    logger?.(error instanceof Error ? error.message : String(error))
  })

  return {
    flush,
    async stop() {
      stopped = true

      if (pollTimer) {
        clearInterval(pollTimer)
      }

      if (heartbeatTimer) {
        clearInterval(heartbeatTimer)
      }

      await postSessionUpdateIfChanged('connecting', 'Desktop companion runtime stopped.', 'session-stop').catch(
        (error) => {
          logger?.(error instanceof Error ? error.message : String(error))
        },
      )
    },
  }
}
