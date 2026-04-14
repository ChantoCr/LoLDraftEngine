import type { DraftState } from '@/domain/draft/types'
import type { LiveDraftSession } from '@/domain/live/types'
import type {
  BackendLiveDraftEvent,
  BackendLiveDraftSource,
  RecognizePlayerRequest,
  RecognizePlayerResponse,
  SubscribeToDraftInput,
} from '@/data/providers/live/backendApi/types'

interface EventSourceLike {
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void
  close(): void
}

interface CreateBackendLiveApiClientInput {
  baseUrl?: string
  fetcher?: typeof fetch
  eventSourceFactory?: (url: string) => EventSourceLike
}

export interface BackendLiveApiClient {
  recognizePlayer(request: RecognizePlayerRequest): Promise<RecognizePlayerResponse>
  subscribeToDraft(input: SubscribeToDraftInput): Promise<() => void>
}

const DEFAULT_BASE_URL = '/api/live'

export function buildRecognizePlayerUrl(baseUrl = DEFAULT_BASE_URL) {
  return `${baseUrl}/session/recognize`
}

export function buildDraftEventsUrl(
  sessionId: string,
  source: BackendLiveDraftSource,
  baseUrl = DEFAULT_BASE_URL,
) {
  return `${baseUrl}/session/${encodeURIComponent(sessionId)}/events?source=${encodeURIComponent(source)}`
}

function parseJsonEvent<TPayload>(event: MessageEvent<string>) {
  return JSON.parse(event.data) as TPayload
}

export function createBackendLiveApiClient({
  baseUrl = DEFAULT_BASE_URL,
  fetcher = fetch,
  eventSourceFactory = (url) => new EventSource(url),
}: CreateBackendLiveApiClientInput = {}): BackendLiveApiClient {
  return {
    async recognizePlayer(request) {
      const response = await fetcher(buildRecognizePlayerUrl(baseUrl), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new Error(`Live API recognize failed: ${response.status} ${response.statusText}`)
      }

      return (await response.json()) as RecognizePlayerResponse
    },
    async subscribeToDraft({ sessionId, source, onDraftState, onSessionUpdate, onError }) {
      const eventSource = eventSourceFactory(buildDraftEventsUrl(sessionId, source, baseUrl))

      eventSource.addEventListener('draft-state', ((event: MessageEvent<string>) => {
        const payload = parseJsonEvent<BackendLiveDraftEvent>(event)
        if (payload.type === 'draft-state') {
          onDraftState(payload.draftState as DraftState)
        }
      }) as EventListener)

      eventSource.addEventListener('session-update', ((event: MessageEvent<string>) => {
        const payload = parseJsonEvent<BackendLiveDraftEvent>(event)
        if (payload.type === 'session-update') {
          onSessionUpdate?.(payload.session as Partial<LiveDraftSession>)
        }
      }) as EventListener)

      eventSource.addEventListener('error', (() => {
        onError?.(new Error('Live draft event stream disconnected.'))
      }) as EventListener)

      return () => {
        eventSource.close()
      }
    },
  }
}
