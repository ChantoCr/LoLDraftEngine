import { mockLiveDraftTimeline } from '@/data/mock/liveDraft'
import type { DraftState } from '@/domain/draft/types'
import type { DesktopClientIngestAck, DesktopClientIngestRequest } from '@server/live/desktopClient/types'

interface CreateMockDesktopCompanionSequenceInput {
  timeline?: DraftState[]
  now?: () => string
}

interface PostMockDesktopCompanionSequenceInput {
  sessionId: string
  baseUrl?: string
  companionToken?: string
  delayMs?: number
  sequence?: DesktopClientIngestRequest[]
  fetcher?: typeof fetch
  logger?: (message: string) => void
}

export function buildDesktopClientIngestUrl(sessionId: string, baseUrl = 'http://localhost:3001') {
  return `${baseUrl.replace(/\/$/, '')}/api/live/desktop-client/session/${encodeURIComponent(sessionId)}/ingest`
}

export function createMockDesktopCompanionSequence({
  timeline = mockLiveDraftTimeline,
  now = () => new Date().toISOString(),
}: CreateMockDesktopCompanionSequenceInput = {}): DesktopClientIngestRequest[] {
  const sessionConnectedAt = now()

  return [
    {
      metadata: {
        eventId: 'session-connect-1',
        sentAt: sessionConnectedAt,
        source: 'mock-desktop-companion',
      },
      session: {
        status: 'connected',
        message: `Mock desktop companion connected. Streaming ${timeline.length} draft snapshots.`,
      },
    },
    ...timeline.map((draftState, index) => ({
      metadata: {
        eventId: `draft-state-${index + 1}`,
        sentAt: now(),
        source: 'mock-desktop-companion' as const,
      },
      draftState,
    })),
  ]
}

function sleep(delayMs: number) {
  return new Promise((resolve) => setTimeout(resolve, delayMs))
}

export async function postMockDesktopCompanionSequence({
  sessionId,
  baseUrl,
  delayMs = 0,
  sequence = createMockDesktopCompanionSequence(),
  companionToken,
  fetcher = fetch,
  logger,
}: PostMockDesktopCompanionSequenceInput): Promise<DesktopClientIngestAck[]> {
  const acknowledgements: DesktopClientIngestAck[] = []
  const ingestUrl = buildDesktopClientIngestUrl(sessionId, baseUrl)

  for (const payload of sequence) {
    const response = await fetcher(ingestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(companionToken ? { 'x-desktop-companion-token': companionToken } : {}),
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const message = await response.text()
      throw new Error(message || `Mock desktop companion ingest failed: ${response.status} ${response.statusText}`)
    }

    const acknowledgement = (await response.json()) as DesktopClientIngestAck
    acknowledgements.push(acknowledgement)

    logger?.(
      `Mock desktop companion posted ${acknowledgement.acceptedEvents.join(', ')} for session ${acknowledgement.sessionId}.`,
    )

    if (delayMs > 0) {
      await sleep(delayMs)
    }
  }

  return acknowledgements
}
