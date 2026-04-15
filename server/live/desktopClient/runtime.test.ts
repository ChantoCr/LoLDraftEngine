import { describe, expect, it, vi } from 'vitest'
import { mockLiveDraftTimeline } from '@/data/mock/liveDraft'
import {
  buildDesktopClientIngestHeaders,
  buildDesktopClientIngestUrl,
  postDesktopClientIngestWithRetry,
  startDesktopCompanionRuntime,
} from '@server/live/desktopClient/runtime'

describe('desktop companion runtime', () => {
  it('adds the optional companion token header to ingest requests', () => {
    expect(buildDesktopClientIngestHeaders()).toEqual({
      'Content-Type': 'application/json',
    })
    expect(buildDesktopClientIngestHeaders('secret-token')).toEqual({
      'Content-Type': 'application/json',
      'x-desktop-companion-token': 'secret-token',
    })
  })

  it('retries ingest delivery before succeeding', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response('temporary failure', { status: 503 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ok: true,
            sessionId: 'desktop-session-1',
            ackId: 'ack-2',
            receivedAt: '2026-04-16T00:10:00.000Z',
            acceptedEvents: ['draft-state'],
            listenerNotifications: 1,
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      )

    const acknowledgement = await postDesktopClientIngestWithRetry({
      sessionId: 'desktop-session-1',
      payload: { draftState: mockLiveDraftTimeline[0] },
      companionToken: 'secret-token',
      fetcher: fetcher as typeof fetch,
      retryDelaysMs: [0, 0],
    })

    expect(fetcher).toHaveBeenNthCalledWith(1, buildDesktopClientIngestUrl('desktop-session-1', undefined), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-desktop-companion-token': 'secret-token',
      },
      body: expect.any(String),
    })
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(acknowledgement.acceptedEvents).toEqual(['draft-state'])
  })

  it('posts connection, heartbeat, and changed draft updates from a bridge-compatible source', async () => {
    const source = {
      describe: () => 'test-source',
      readDraftState: vi
        .fn()
        .mockResolvedValueOnce(mockLiveDraftTimeline[0])
        .mockResolvedValueOnce(mockLiveDraftTimeline[0])
        .mockResolvedValueOnce(mockLiveDraftTimeline[1]),
    }
    const fetcher = vi.fn().mockImplementation(async () =>
      new Response(
        JSON.stringify({
          ok: true,
          sessionId: 'desktop-session-1',
          ackId: 'ack-1',
          receivedAt: '2026-04-16T00:10:00.000Z',
          acceptedEvents: ['session-update'],
          listenerNotifications: 1,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    )

    const runtime = startDesktopCompanionRuntime({
      sessionId: 'desktop-session-1',
      source,
      fetcher: fetcher as typeof fetch,
      pollIntervalMs: 60_000,
      heartbeatIntervalMs: 60_000,
      retryDelaysMs: [0],
      logger: vi.fn(),
    })

    await new Promise((resolve) => setTimeout(resolve, 0))
    await runtime.flush()
    await runtime.flush()
    await runtime.stop()

    expect(fetcher).toHaveBeenCalled()
    expect(source.readDraftState).toHaveBeenCalledTimes(3)
  })
})
