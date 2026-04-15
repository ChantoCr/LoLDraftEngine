import { useCallback, useEffect, useRef, useState } from 'react'
import type { DraftState } from '@/domain/draft/types'
import type { LiveDraftProvider } from '@/domain/live/provider'
import type { LiveDraftSession, LiveDraftSyncMode, SummonerIdentity } from '@/domain/live/types'

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

function createInitialSession(syncMode: LiveDraftSyncMode): LiveDraftSession {
  return {
    status: 'idle',
    syncMode,
    message:
      'Choose a sync mode. Manual mode keeps the board fully interactive; mock live mode streams fixture draft states; Riot and desktop modes are scaffolded for future integration.',
  }
}

export function useLiveDraftSession({ providers, onDraftState }: UseLiveDraftSessionInput) {
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
    setSession((currentSession) => ({
      ...currentSession,
      status: 'idle',
      syncMode,
      message: 'Live sync stopped. Manual draft interaction remains available.',
    }))
  }, [syncMode])

  useEffect(() => {
    return () => {
      unsubscribeRef.current?.()
    }
  }, [])

  const startSession = useCallback(async () => {
    unsubscribeRef.current?.()
    unsubscribeRef.current = undefined

    if (!identity.gameName || !identity.tagLine) {
      setSession({
        status: 'error',
        syncMode,
        message: 'Enter both game name and tag line before starting a session.',
      })
      return
    }

    if (syncMode === 'MANUAL') {
      setSession({
        player: identity,
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
        player: identity,
        status: 'error',
        syncMode,
        message: 'No live-draft provider is configured for this sync mode yet.',
      })
      return
    }

    setSession({
      player: identity,
      status: 'connecting',
      syncMode,
      message: 'Connecting to live draft provider...',
    })

    const recognizedSession = await provider.recognizePlayer(identity)
    setSession(recognizedSession)

    if (recognizedSession.status !== 'connected') {
      return
    }

    unsubscribeRef.current = await provider.subscribeToLiveDraft(
      recognizedSession,
      (draftState) => {
        draftStateCallbackRef.current(draftState)
        setSession((currentSession) => ({
          ...currentSession,
          status: 'connected',
          lastSyncAt: new Date().toISOString(),
        }))
      },
      (partialSession) => {
        setSession((currentSession) => ({
          ...currentSession,
          ...partialSession,
          status: partialSession.status ?? currentSession.status,
          message: partialSession.message ?? currentSession.message,
          lastSyncAt: new Date().toISOString(),
        }))
      },
    )
  }, [identity, providers, syncMode])

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
  }
}
