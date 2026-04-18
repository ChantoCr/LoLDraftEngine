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
      readSnapshot: vi
        .fn()
        .mockResolvedValueOnce({
          kind: 'FILE',
          status: 'active',
          observedAt: '2026-04-16T00:10:00.000Z',
          draftState: mockLiveDraftTimeline[0],
        })
        .mockResolvedValueOnce({
          kind: 'FILE',
          status: 'active',
          observedAt: '2026-04-16T00:10:01.000Z',
          draftState: mockLiveDraftTimeline[0],
        })
        .mockResolvedValueOnce({
          kind: 'FILE',
          status: 'active',
          observedAt: '2026-04-16T00:10:02.000Z',
          draftState: mockLiveDraftTimeline[1],
        }),
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
    expect(source.readSnapshot).toHaveBeenCalledTimes(3)
  })

  it('posts source-status updates when the source is unavailable or errors', async () => {
    const source = {
      describe: () => 'lcu-source',
      readSnapshot: vi
        .fn()
        .mockResolvedValueOnce({
          kind: 'LCU' as const,
          status: 'unavailable' as const,
          observedAt: '2026-04-16T00:11:00.000Z',
          message: 'LCU champ-select session is not currently available.',
        })
        .mockRejectedValueOnce(new Error('LCU certificate handshake failed')),
    }
    const fetchBodies: string[] = []
    const fetcher = vi.fn().mockImplementation(async (_input, init) => {
      fetchBodies.push(String(init?.body ?? ''))

      return new Response(
        JSON.stringify({
          ok: true,
          sessionId: 'desktop-session-status',
          ackId: 'ack-status',
          receivedAt: '2026-04-16T00:11:00.000Z',
          acceptedEvents: ['session-update'],
          listenerNotifications: 1,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    })

    const runtime = startDesktopCompanionRuntime({
      sessionId: 'desktop-session-status',
      source,
      fetcher: fetcher as typeof fetch,
      pollIntervalMs: 60_000,
      heartbeatIntervalMs: 60_000,
      retryDelaysMs: [0],
      logger: vi.fn(),
    })

    await new Promise((resolve) => setTimeout(resolve, 0))
    await expect(runtime.flush()).rejects.toThrow('LCU certificate handshake failed')
    await runtime.stop()

    const sessionPosts = fetchBodies.filter((body) => body.includes('"session"'))

    expect(sessionPosts.some((body) => body.includes('LCU champ-select session is not currently available.'))).toBe(true)
    expect(sessionPosts.some((body) => body.includes('LCU certificate handshake failed'))).toBe(true)
  })

  it('serializes rapid flush requests so source reads do not overlap', async () => {
    let activeReads = 0
    let maxConcurrentReads = 0
    let nextDraftIndex = 0

    const source = {
      describe: () => 'test-source',
      readSnapshot: vi.fn().mockImplementation(async () => {
        activeReads += 1
        maxConcurrentReads = Math.max(maxConcurrentReads, activeReads)

        const draftState = mockLiveDraftTimeline[Math.min(nextDraftIndex, mockLiveDraftTimeline.length - 1)]
        nextDraftIndex += 1

        await new Promise((resolve) => setTimeout(resolve, 5))
        activeReads -= 1

        return {
          kind: 'FILE' as const,
          status: 'active' as const,
          observedAt: `2026-04-16T00:10:0${nextDraftIndex}.000Z`,
          draftState,
        }
      }),
    }

    const fetchBodies: string[] = []
    const fetcher = vi.fn().mockImplementation(async (_input, init) => {
      fetchBodies.push(String(init?.body ?? ''))

      return new Response(
        JSON.stringify({
          ok: true,
          sessionId: 'desktop-session-rapid',
          ackId: 'ack-rapid',
          receivedAt: '2026-04-16T00:10:00.000Z',
          acceptedEvents: ['session-update'],
          listenerNotifications: 1,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    })

    const runtime = startDesktopCompanionRuntime({
      sessionId: 'desktop-session-rapid',
      source,
      fetcher: fetcher as typeof fetch,
      pollIntervalMs: 60_000,
      heartbeatIntervalMs: 60_000,
      retryDelaysMs: [0],
      logger: vi.fn(),
    })

    await new Promise((resolve) => setTimeout(resolve, 10))
    await Promise.all([runtime.flush(), runtime.flush(), runtime.flush()])
    await runtime.stop()

    const draftStatePosts = fetchBodies.filter((body) => body.includes('"draftState"'))

    expect(maxConcurrentReads).toBe(1)
    expect(source.readSnapshot).toHaveBeenCalledTimes(4)
    expect(draftStatePosts).toHaveLength(3)
  })
})
