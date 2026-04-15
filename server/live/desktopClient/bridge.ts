import type { BackendLiveDraftEvent } from '@/data/providers/live/backendApi/types'

export class DesktopClientBridge {
  private readonly listeners = new Map<string, Set<(event: BackendLiveDraftEvent) => void>>()

  subscribe(sessionId: string, listener: (event: BackendLiveDraftEvent) => void) {
    const existingListeners = this.listeners.get(sessionId) ?? new Set<(event: BackendLiveDraftEvent) => void>()
    existingListeners.add(listener)
    this.listeners.set(sessionId, existingListeners)

    return () => {
      const currentListeners = this.listeners.get(sessionId)
      currentListeners?.delete(listener)

      if (currentListeners && currentListeners.size === 0) {
        this.listeners.delete(sessionId)
      }
    }
  }

  emit(sessionId: string, event: BackendLiveDraftEvent) {
    const listeners = this.listeners.get(sessionId)

    if (!listeners) {
      return 0
    }

    listeners.forEach((listener) => listener(event))
    return listeners.size
  }
}
