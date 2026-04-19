import { useCallback, useEffect, useRef, useState } from 'react'
import { createBackendLiveApiClient } from '@/data/providers/live/backendApi/client'
import type { DraftState } from '@/domain/draft/types'
import type { LiveDraftProvider } from '@/domain/live/provider'
import type {
  LiveDebugTimelineEntry,
  LiveDraftSession,
  LiveDraftSyncMode,
  LiveSnapshotSource,
  SummonerIdentity,
} from '@/domain/live/types'

interface UseLiveDraftSessionInput {
  providers: Partial<Record<LiveDraftSyncMode, LiveDraftProvider>>
  onDraftState: (draftState: DraftState) => void
}

function createInitialIdentity(): SummonerIdentity {
  return {
    gameName: '',
    tagLine: '',
    region: 'LAN',
  }
}

function createDesktopCompanionIdentity(region: SummonerIdentity['region']): SummonerIdentity {
  return {
    gameName: 'Desktop Companion',
    tagLine: 'LOCAL',
    region,
  }
}

function getInitialSessionMessage(syncMode: LiveDraftSyncMode) {
  switch (syncMode) {
    case 'MANUAL':
      return 'Manual mode keeps the board fully interactive. No backend connection is required.'
    case 'MOCK':
      return 'Mock live mode streams fixture draft states for validation and UI testing.'
    case 'RIOT_API':
      return 'Riot API mode requires the backend companion plus a valid `RIOT_API_KEY`. It can recognize players and active games, but not true champ-select picks.'
    case 'DESKTOP_CLIENT':
      return 'Desktop client mode requires the local backend plus a desktop companion source. It does not need Riot API recognition for live pick/ban sync.'
  }
}

function createInitialSession(syncMode: LiveDraftSyncMode): LiveDraftSession {
  return {
    status: 'idle',
    syncMode,
    message: getInitialSessionMessage(syncMode),
  }
}

function toSnapshotSource(syncMode: LiveDraftSyncMode): LiveSnapshotSource | undefined {
  if (syncMode === 'MANUAL') {
    return undefined
  }

  return syncMode
}

function appendTimelineEntry(
  currentTimeline: LiveDebugTimelineEntry[] | undefined,
  entry: Omit<LiveDebugTimelineEntry, 'timestamp'> & { timestamp?: string },
) {
  const nextEntry: LiveDebugTimelineEntry = {
    ...entry,
    timestamp: entry.timestamp ?? new Date().toISOString(),
  }

  return [...(currentTimeline ?? []), nextEntry].slice(-8)
}

export function useLiveDraftSession({ providers, onDraftState }: UseLiveDraftSessionInput) {
  const backendLiveApiClientRef = useRef(createBackendLiveApiClient())
  const [identity, setIdentity] = useState<SummonerIdentity>(createInitialIdentity)
  const [syncMode, setSyncMode] = useState<LiveDraftSyncMode>('MANUAL')
  const [session, setSession] = useState<LiveDraftSession>(() => createInitialSession('MANUAL'))
  const draftStateCallbackRef = useRef(onDraftState)
  const unsubscribeRef = useRef<(() => void) | undefined>(undefined)

  useEffect(() => {
    draftStateCallbackRef.current = onDraftState
  }, [onDraftState])

  const stopSession = useCallback(() => {
    unsubscribeRef.current?.()
    unsubscribeRef.current = undefined
    setSession({
      status: 'idle',
      syncMode,
      message: syncMode === 'MANUAL' ? getInitialSessionMessage(syncMode) : 'Live sync stopped. Manual draft interaction remains available.',
    })
  }, [syncMode])

  useEffect(() => {
    return () => {
      unsubscribeRef.current?.()
    }
  }, [])

  const startSession = useCallback(async () => {
    unsubscribeRef.current?.()
    unsubscribeRef.current = undefined

    const effectiveIdentity =
      syncMode === 'DESKTOP_CLIENT'
        ? createDesktopCompanionIdentity(identity.region)
        : identity

    if (syncMode !== 'DESKTOP_CLIENT' && (!identity.gameName || !identity.tagLine)) {
      setSession({
        status: 'error',
        syncMode,
        message: 'Enter both game name and tag line before starting a session.',
      })
      return
    }

    if (syncMode === 'MANUAL') {
      setSession({
        player: effectiveIdentity,
        status: 'manual',
        syncMode,
        lastSyncAt: new Date().toISOString(),
        message:
          'Player identity captured. Manual draft editing is active and remains the source of truth until a live provider is connected.',
      })
      return
    }

    const provider = providers[syncMode]

    if (!provider) {
      setSession({
        player: effectiveIdentity,
        status: 'error',
        syncMode,
        message: 'No live-draft provider is configured for this sync mode yet.',
      })
      return
    }

    setSession({
      player: effectiveIdentity,
      status: 'connecting',
      syncMode,
      message: 'Connecting to live draft provider...',
      snapshotDebug: toSnapshotSource(syncMode) ? { source: toSnapshotSource(syncMode)! } : undefined,
      debugTimeline:
        syncMode === 'DESKTOP_CLIENT'
          ? appendTimelineEntry([], {
              kind: 'action',
              title: 'Desktop session starting',
              description: 'Waiting for the desktop companion to subscribe and begin sending ingest events.',
            })
          : undefined,
    })

    const recognizedSession = await provider.recognizePlayer(effectiveIdentity)
    setSession({
      ...recognizedSession,
      debugTimeline:
        syncMode === 'DESKTOP_CLIENT'
          ? appendTimelineEntry(recognizedSession.debugTimeline, {
              kind: 'session-update',
              title: 'Desktop session opened',
              description: recognizedSession.message ?? 'Desktop session opened.',
            })
          : recognizedSession.debugTimeline,
    })

    if (recognizedSession.initialDraftState) {
      draftStateCallbackRef.current(recognizedSession.initialDraftState)
    }

    if (recognizedSession.status !== 'connected') {
      return
    }

    unsubscribeRef.current = await provider.subscribeToLiveDraft(
      recognizedSession,
      (draftState) => {
        draftStateCallbackRef.current(draftState)
        setSession((currentSession) => {
          const snapshotSource = toSnapshotSource(currentSession.syncMode)

          return {
            ...currentSession,
            status: 'connected',
            lastSyncAt: new Date().toISOString(),
            snapshotDebug: snapshotSource
              ? {
                  source: snapshotSource,
                  snapshotMapped: true,
                  lastSnapshotAt: new Date().toISOString(),
                }
              : currentSession.snapshotDebug,
            debugTimeline:
              currentSession.syncMode === 'DESKTOP_CLIENT'
                ? appendTimelineEntry(currentSession.debugTimeline, {
                    kind: 'draft-state',
                    title: 'Draft-state snapshot received',
                    description: 'The desktop companion delivered a draft-state update to the board.',
                  })
                : currentSession.debugTimeline,
          }
        })
      },
      (partialSession) => {
        setSession((currentSession) => {
          const isHeartbeat = Boolean(partialSession.lastHeartbeatAt)
          const timelineTitle = isHeartbeat ? 'Heartbeat received' : 'Session update received'
          const timelineDescription =
            partialSession.message ??
            (isHeartbeat
              ? 'The desktop companion sent a heartbeat update.'
              : 'The live provider sent a session update.')

          return {
            ...currentSession,
            ...partialSession,
            status: partialSession.status ?? currentSession.status,
            message: partialSession.message ?? currentSession.message,
            snapshotDebug: partialSession.snapshotDebug ?? currentSession.snapshotDebug,
            riotLookupDebug: partialSession.riotLookupDebug ?? currentSession.riotLookupDebug,
            lastHeartbeatAt: partialSession.lastHeartbeatAt ?? currentSession.lastHeartbeatAt,
            companionInstanceId: partialSession.companionInstanceId ?? currentSession.companionInstanceId,
            lastIngestEventId: partialSession.lastIngestEventId ?? currentSession.lastIngestEventId,
            lastIngestSequenceNumber:
              partialSession.lastIngestSequenceNumber ?? currentSession.lastIngestSequenceNumber,
            debugTimeline:
              currentSession.syncMode === 'DESKTOP_CLIENT'
                ? appendTimelineEntry(currentSession.debugTimeline, {
                    kind: isHeartbeat ? 'heartbeat' : 'session-update',
                    title: timelineTitle,
                    description: timelineDescription,
                  })
                : currentSession.debugTimeline,
            lastSyncAt: new Date().toISOString(),
          }
        })
      },
    )
  }, [identity, providers, syncMode])

  const triggerDesktopMockSequence = useCallback(async () => {
    if (syncMode !== 'DESKTOP_CLIENT' || !session.sessionId) {
      setSession((currentSession) => ({
        ...currentSession,
        message: 'Start a desktop-client session before triggering the mock bridge sequence.',
      }))
      return
    }

    try {
      const result = await backendLiveApiClientRef.current.triggerDesktopMockSequence(session.sessionId)
      setSession((currentSession) => ({
        ...currentSession,
        status: 'connected',
        lastSyncAt: new Date().toISOString(),
        message: `Desktop mock bridge triggered successfully. Emitted ${result.emittedStates} draft snapshots.`,
        debugTimeline: appendTimelineEntry(currentSession.debugTimeline, {
          kind: 'action',
          title: 'Desktop mock triggered',
          description: `The backend mock route emitted ${result.emittedStates} draft snapshots for this desktop session.`,
        }),
      }))
    } catch (error) {
      setSession((currentSession) => ({
        ...currentSession,
        status: 'error',
        message: error instanceof Error ? error.message : 'Unable to trigger the desktop mock bridge.',
      }))
    }
  }, [session.sessionId, syncMode])

  const updateSyncMode = useCallback((nextSyncMode: LiveDraftSyncMode) => {
    unsubscribeRef.current?.()
    unsubscribeRef.current = undefined
    setSyncMode(nextSyncMode)
    setSession(createInitialSession(nextSyncMode))
  }, [])

  return {
    identity,
    session,
    syncMode,
    setIdentity,
    setSyncMode: updateSyncMode,
    startSession,
    stopSession,
    triggerDesktopMockSequence,
  }
}
