import { describe, expect, it, vi } from 'vitest'
import { mockLiveDraftTimeline } from '@/data/mock/liveDraft'
import {
  buildDesktopClientIngestUrl,
  createMockDesktopCompanionSequence,
  postMockDesktopCompanionSequence,
} from '@server/live/desktopClient/mockCompanion'

describe('mock desktop companion runtime', () => {
  it('builds a sequence with one session update followed by draft-state payloads', () => {
    const sequence = createMockDesktopCompanionSequence({
      timeline: mockLiveDraftTimeline.slice(0, 2),
      now: () => '2026-04-15T21:45:00.000Z',
    })

    expect(sequence).toHaveLength(3)
    expect(sequence[0]).toMatchObject({
      metadata: {
        eventId: 'session-connect-1',
        source: 'mock-desktop-companion',
      },
      session: {
        status: 'connected',
      },
    })
    expect(sequence[1]).toMatchObject({
      metadata: {
        eventId: 'draft-state-1',
        source: 'mock-desktop-companion',
      },
      draftState: mockLiveDraftTimeline[0],
    })
  })

  it('posts the mapped payloads to the desktop ingest endpoint and returns ack payloads', async () => {
    const fetcher = vi.fn().mockImplementation(async () =>
      new Response(
        JSON.stringify({
          ok: true,
          sessionId: 'desktop-session-1',
          ackId: 'ack-1',
          receivedAt: '2026-04-15T21:45:01.000Z',
          acceptedEvents: ['session-update'],
          listenerNotifications: 1,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    )

    const acknowledgements = await postMockDesktopCompanionSequence({
      sessionId: 'desktop-session-1',
      baseUrl: 'http://localhost:3001',
      sequence: createMockDesktopCompanionSequence({ timeline: mockLiveDraftTimeline.slice(0, 1) }),
      fetcher: fetcher as typeof fetch,
    })

    expect(fetcher).toHaveBeenCalledWith(buildDesktopClientIngestUrl('desktop-session-1', 'http://localhost:3001'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: expect.any(String),
    })
    expect(acknowledgements).toHaveLength(2)
    expect(acknowledgements[0]?.sessionId).toBe('desktop-session-1')
  })
})
