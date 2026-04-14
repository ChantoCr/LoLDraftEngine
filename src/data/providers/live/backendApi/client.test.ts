import { describe, expect, it, vi } from 'vitest'
import {
  buildDraftEventsUrl,
  buildRecognizePlayerUrl,
  createBackendLiveApiClient,
} from '@/data/providers/live/backendApi/client'

describe('backend live api client', () => {
  it('builds stable local backend urls for player recognition and event streams', () => {
    expect(buildRecognizePlayerUrl('/api/live')).toBe('/api/live/session/recognize')
    expect(buildDraftEventsUrl('session-1', 'RIOT_API', '/api/live')).toBe(
      '/api/live/session/session-1/events?source=RIOT_API',
    )
  })

  it('posts recognition requests to the local backend contract', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        sessionId: 'session-1',
        player: { gameName: 'Tester', tagLine: 'LAN', region: 'LAN' },
        status: 'connected',
        syncMode: 'RIOT_API',
        region: 'LAN',
      }),
    })
    const client = createBackendLiveApiClient({ fetcher, eventSourceFactory: vi.fn() as never })

    const response = await client.recognizePlayer({
      identity: { gameName: 'Tester', tagLine: 'LAN', region: 'LAN' },
      source: 'RIOT_API',
    })

    expect(fetcher).toHaveBeenCalledWith('/api/live/session/recognize', expect.objectContaining({ method: 'POST' }))
    expect(response.sessionId).toBe('session-1')
  })
})
