import type { BackendLiveDraftSource } from '@/data/providers/live/backendApi/types'
import type { LiveSessionRecord } from '@server/live/types'

export class InMemoryLiveSessionStore {
  private readonly sessions = new Map<string, LiveSessionRecord>()

  create(session: LiveSessionRecord) {
    this.sessions.set(session.id, session)
    return session
  }

  get(sessionId: string) {
    return this.sessions.get(sessionId)
  }

  update(sessionId: string, partialSession: Partial<Omit<LiveSessionRecord, 'id' | 'source' | 'player'>>) {
    const existingSession = this.sessions.get(sessionId)

    if (!existingSession) {
      return undefined
    }

    const nextSession = {
      ...existingSession,
      ...partialSession,
      updatedAt: partialSession.updatedAt ?? new Date().toISOString(),
    }

    this.sessions.set(sessionId, nextSession)
    return nextSession
  }

  findBySource(source: BackendLiveDraftSource) {
    return [...this.sessions.values()].filter((session) => session.source === source)
  }
}
