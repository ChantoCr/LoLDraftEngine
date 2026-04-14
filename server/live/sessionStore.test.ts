import { describe, expect, it } from 'vitest'
import { InMemoryLiveSessionStore } from '@server/live/sessionStore'

describe('InMemoryLiveSessionStore', () => {
  it('creates, retrieves, and updates live sessions', () => {
    const store = new InMemoryLiveSessionStore()
    const createdSession = store.create({
      id: 'session-1',
      source: 'MOCK',
      player: { gameName: 'Tester', tagLine: 'LAN', region: 'LAN' },
      status: 'connected',
      message: 'Connected',
      createdAt: '2026-04-13T20:20:00.000Z',
      updatedAt: '2026-04-13T20:20:00.000Z',
    })

    expect(store.get('session-1')).toEqual(createdSession)

    const updatedSession = store.update('session-1', {
      status: 'error',
      message: 'Stream disconnected',
      updatedAt: '2026-04-13T20:21:00.000Z',
    })

    expect(updatedSession).toMatchObject({
      status: 'error',
      message: 'Stream disconnected',
    })
    expect(store.findBySource('MOCK')).toHaveLength(1)
  })
})
