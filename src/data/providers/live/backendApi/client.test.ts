import { describe, expect, it, vi } from 'vitest'
import {
  buildDesktopMockSequenceUrl,
  buildDraftEventsUrl,
  buildRecognizePlayerUrl,
  createBackendLiveApiClient,
} from '@/data/providers/live/backendApi/client'

describe('backend live api client', () => {
  it('builds stable local backend urls for player recognition, event streams, and desktop mock triggers', () => {
    expect(buildRecognizePlayerUrl('/api/live')).toBe('/api/live/session/recognize')
    expect(buildDraftEventsUrl('session-1', 'RIOT_API', '/api/live')).toBe(
      '/api/live/session/session-1/events?source=RIOT_API',
    )
    expect(buildDesktopMockSequenceUrl('session-1', '/api/live')).toBe(
      '/api/live/desktop-client/mock/session/session-1/mock-sequence',
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

  it('posts desktop mock trigger requests to the local backend contract', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true, emittedStates: 3 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    const client = createBackendLiveApiClient({ fetcher, eventSourceFactory: vi.fn() as never })

    const response = await client.triggerDesktopMockSequence('desktop-session-1')

    expect(fetcher).toHaveBeenCalledWith('/api/live/desktop-client/mock/session/desktop-session-1/mock-sequence', {
      method: 'POST',
    })
    expect(response.emittedStates).toBe(3)
  })

  it('surfaces backend error payload messages for recognition failures', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: 'RIOT_API_KEY is not configured on the backend companion.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    const client = createBackendLiveApiClient({ fetcher, eventSourceFactory: vi.fn() as never })

    await expect(
      client.recognizePlayer({
        identity: { gameName: 'Tester', tagLine: 'LAN', region: 'LAN' },
        source: 'RIOT_API',
      }),
    ).rejects.toThrow('RIOT_API_KEY is not configured on the backend companion.')
  })
})
