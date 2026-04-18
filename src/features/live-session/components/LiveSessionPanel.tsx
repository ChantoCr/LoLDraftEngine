import { useState, type ChangeEvent, type FormEvent } from 'react'
import { LIVE_DRAFT_SYNC_MODE_LABELS, RIOT_REGION_LABELS, RIOT_REGIONS } from '@/domain/live/constants'
import type { LiveDraftSession, LiveDraftSyncMode, RiotLookupStepStatus, SummonerIdentity } from '@/domain/live/types'
import { Panel } from '@/shared/ui/Panel'

interface LiveSessionPanelProps {
  identity: SummonerIdentity
  session: LiveDraftSession
  syncMode: LiveDraftSyncMode
  onIdentityChange: (identity: SummonerIdentity) => void
  onSyncModeChange: (syncMode: LiveDraftSyncMode) => void
  onStartSession: () => void
  onStopSession: () => void
  onTriggerDesktopMockSequence: () => void
}

function getLiveStatusIndicator(session: LiveDraftSession, syncMode: LiveDraftSyncMode) {
  if (session.status === 'error') {
    return {
      label: 'Issue detected',
      tone: 'bg-rose-400',
      description: 'The current live-session flow needs attention before reliable sync can continue.',
    }
  }

  if (syncMode === 'DESKTOP_CLIENT') {
    if (session.status === 'connected' && session.message?.toLowerCase().includes('waiting')) {
      return {
        label: 'Companion connected, waiting for draft state',
        tone: 'bg-amber-400',
        description: 'The desktop session is subscribed, but no draft-state payload has updated the board yet.',
      }
    }

    if (session.status === 'connected') {
      return {
        label: 'Draft updates flowing',
        tone: 'bg-emerald-400',
        description: 'Desktop companion events are connected and draft updates can reach the board.',
      }
    }
  }

  if (session.status === 'connecting') {
    return {
      label: 'Connecting',
      tone: 'bg-cyan-400',
      description: 'The selected live provider is currently establishing its session.',
    }
  }

  if (session.status === 'manual') {
    return {
      label: 'Manual mode',
      tone: 'bg-slate-400',
      description: 'Manual draft editing is the active source of truth.',
    }
  }

  if (session.status === 'connected') {
    return {
      label: 'Connected',
      tone: 'bg-emerald-400',
      description: 'The selected live provider is connected.',
    }
  }

  return {
    label: 'Idle',
    tone: 'bg-slate-500',
    description: 'Start a session to begin live recognition or desktop companion sync.',
  }
}

function getRiotTroubleshootingItems() {
  return [
    'Use your exact Riot ID: game name + tagline. Example: `TeriyakiBoy` + `LAN` for `TeriyakiBoy#LAN`.',
    'The selected region is your League shard/platform, not just the Riot tagline. Keep `LAN` only if the account actually plays on LAN / la1.',
    'Riot API mode can recognize the player and sometimes confirm an active game, but it cannot stream champ select.',
    'Riot active-game checks work for active spectatable games, not champ select. Practice Tool and some non-standard sessions may not be available through spectator APIs.',
    'If desktop LCU mode already works, use DESKTOP_CLIENT as the real live draft path. Riot mode is only a secondary recognition check.',
  ]
}

function getRiotLookupStatusPresentation(status: RiotLookupStepStatus) {
  switch (status) {
    case 'success':
      return { label: 'Success', tone: 'text-emerald-300' }
    case 'failed':
      return { label: 'Failed', tone: 'text-rose-300' }
    case 'not-found':
      return { label: 'Not found', tone: 'text-amber-300' }
    case 'not-needed':
      return { label: 'Not needed', tone: 'text-slate-300' }
    case 'skipped':
      return { label: 'Skipped', tone: 'text-slate-300' }
  }
}

function getRiotPipelineSummary(session: LiveDraftSession) {
  const lookupDebug = session.riotLookupDebug

  if (!lookupDebug) {
    return []
  }

  const recognitionReady =
    lookupDebug.accountLookup.status === 'success' && lookupDebug.summonerLookupByPuuid.status === 'success'
  const spectatorRecoveryBlocked =
    lookupDebug.summonerLookupByNameFallback.status === 'failed' || lookupDebug.encryptedSummonerId.status === 'failed'
  const activeGameFound = lookupDebug.activeGameLookup.status === 'success'
  const boardMapped = session.snapshotDebug?.snapshotMapped === true

  return [
    {
      label: 'Recognition',
      value: recognitionReady ? 'Ready' : 'Blocked',
      tone: recognitionReady ? 'text-emerald-300' : 'text-rose-300',
      description: recognitionReady
        ? 'Riot account and base summoner recognition succeeded.'
        : 'Recognition did not fully complete. Check the detailed lookup steps below.',
    },
    {
      label: 'Spectator recovery',
      value: spectatorRecoveryBlocked ? 'Blocked' : lookupDebug.encryptedSummonerId.status === 'success' ? 'Ready' : 'Waiting',
      tone: spectatorRecoveryBlocked
        ? 'text-amber-300'
        : lookupDebug.encryptedSummonerId.status === 'success'
          ? 'text-emerald-300'
          : 'text-slate-300',
      description: spectatorRecoveryBlocked
        ? 'Riot did not provide a usable encrypted summoner id, so spectator lookup could not continue.'
        : lookupDebug.encryptedSummonerId.status === 'success'
          ? 'A usable encrypted summoner id is available for spectator lookup.'
          : 'Spectator recovery has not completed yet.',
    },
    {
      label: 'Active game',
      value: activeGameFound
        ? 'Found'
        : lookupDebug.activeGameLookup.status === 'not-found'
          ? 'Not found'
          : lookupDebug.activeGameLookup.status === 'skipped'
            ? 'Not attempted'
            : 'Unavailable',
      tone: activeGameFound
        ? 'text-emerald-300'
        : lookupDebug.activeGameLookup.status === 'not-found'
          ? 'text-amber-300'
          : 'text-slate-300',
      description: activeGameFound
        ? 'Riot spectator APIs returned an active game roster.'
        : lookupDebug.activeGameLookup.status === 'not-found'
          ? 'No active spectatable game was returned for this player.'
          : 'Active-game lookup did not complete because spectator recovery was not available.',
    },
    {
      label: 'Board mapping',
      value: boardMapped ? 'Mapped' : activeGameFound ? 'Not mapped' : 'Not attempted',
      tone: boardMapped ? 'text-emerald-300' : activeGameFound ? 'text-amber-300' : 'text-slate-300',
      description: boardMapped
        ? 'The current live roster snapshot populated the draft board.'
        : activeGameFound
          ? 'A live roster existed, but it did not map into the board yet.'
          : 'Board mapping could not start because no usable spectator snapshot was available.',
    },
  ]
}

export function LiveSessionPanel({
  identity,
  session,
  syncMode,
  onIdentityChange,
  onSyncModeChange,
  onStartSession,
  onStopSession,
  onTriggerDesktopMockSequence,
}: LiveSessionPanelProps) {
  const [copyFeedback, setCopyFeedback] = useState<string | undefined>(undefined)

  function updateField(field: 'gameName' | 'tagLine') {
    return (event: ChangeEvent<HTMLInputElement>) => {
      onIdentityChange({
        ...identity,
        [field]: event.target.value,
      })
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void onStartSession()
  }

  async function copyText(value: string, successMessage: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopyFeedback(successMessage)
      window.setTimeout(() => setCopyFeedback(undefined), 2000)
    } catch {
      setCopyFeedback('Clipboard copy failed. You can still select and copy the text manually.')
      window.setTimeout(() => setCopyFeedback(undefined), 2500)
    }
  }

  const isLiveLikeMode = syncMode !== 'MANUAL'
  const panelTitle = syncMode === 'DESKTOP_CLIENT' ? 'Desktop companion session' : 'Riot account session'
  const panelSubtitle =
    syncMode === 'DESKTOP_CLIENT'
      ? 'Desktop mode uses the local backend bridge and companion runtime for real pick/ban sync. Riot public APIs are not the source of truth here.'
      : 'Use your Riot ID here: game name + tag line. RIOT_API mode requires the backend companion to be running with RIOT_API_KEY configured in `.env.local` or `.env` (not only `.env.example`). Riot can recognize the player and active game, but full champ-select sync still needs the desktop bridge.'
  const syncModeHelpText =
    syncMode === 'RIOT_API'
      ? 'RIOT_API mode needs a valid backend `RIOT_API_KEY` in `.env.local` or `.env`, then run `npm run server:dev`. Enter your exact Riot ID: game name + tagline. The selected region is your LoL shard, not the same thing as the Riot tagline.'
      : syncMode === 'DESKTOP_CLIENT'
        ? 'DESKTOP_CLIENT mode does not require Riot name/tag input. It does require the local backend (`npm run server:dev`) plus a desktop companion source posting draft updates.'
        : syncMode === 'MOCK'
          ? 'MOCK mode is useful for validating the live-session flow without relying on Riot APIs or a real local client.'
          : 'MANUAL mode keeps the draft board interactive without any backend live session dependency.'
  const companionCommands = session.sessionId
    ? [
        `npm run desktop:mock -- ${session.sessionId}`,
        `npm run desktop:lcu -- ${session.sessionId} latest`,
        `npm run desktop:file -- ${session.sessionId} C:/path/to/draftState.json`,
      ]
    : ['Start a DESKTOP_CLIENT session first to get a session id.']
  const liveStatusIndicator = getLiveStatusIndicator(session, syncMode)
  const riotTroubleshootingItems = getRiotTroubleshootingItems()
  const snapshotDebugSource = session.snapshotDebug?.source ?? (syncMode === 'MANUAL' ? undefined : syncMode)
  const snapshotMappedLabel =
    session.snapshotDebug?.snapshotMapped === true
      ? 'Yes'
      : session.snapshotDebug?.snapshotMapped === false
        ? 'No'
        : 'Awaiting snapshot'
  const snapshotFailureReason = session.snapshotDebug?.lastMappingFailureReason ?? 'No mapping failure recorded yet.'
  const riotPipelineSummary = getRiotPipelineSummary(session)
  const riotLookupSteps = session.riotLookupDebug
    ? [
        {
          label: 'Account lookup',
          step: session.riotLookupDebug.accountLookup,
        },
        {
          label: 'Summoner lookup by PUUID',
          step: session.riotLookupDebug.summonerLookupByPuuid,
        },
        {
          label: 'Fallback summoner lookup by name',
          step: session.riotLookupDebug.summonerLookupByNameFallback,
        },
        {
          label: 'Encrypted summoner id',
          step: session.riotLookupDebug.encryptedSummonerId,
        },
        {
          label: 'Active game lookup',
          step: session.riotLookupDebug.activeGameLookup,
        },
      ]
    : []

  return (
    <Panel eyebrow="Live Draft Session" title={panelTitle} subtitle={panelSubtitle}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-3 sm:grid-cols-3">
          {syncMode === 'DESKTOP_CLIENT' ? (
            <div className="sm:col-span-2 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm leading-6 text-slate-300">
              Desktop companion mode uses a local placeholder identity automatically. Riot game name and tag line are not required here.
            </div>
          ) : (
            <>
              <label className="space-y-2 sm:col-span-1">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Riot game name</span>
                <input
                  value={identity.gameName}
                  onChange={updateField('gameName')}
                  placeholder="PlayerName"
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400/40"
                />
              </label>
              <label className="space-y-2 sm:col-span-1">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Riot tag line</span>
                <input
                  value={identity.tagLine}
                  onChange={updateField('tagLine')}
                  placeholder="1234"
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400/40"
                />
              </label>
            </>
          )}
          <label className="space-y-2 sm:col-span-1">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Region</span>
            <select
              value={identity.region}
              onChange={(event) =>
                onIdentityChange({
                  ...identity,
                  region: event.target.value as SummonerIdentity['region'],
                })
              }
              className="w-full rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400/40"
            >
              {RIOT_REGIONS.map((region) => (
                <option key={region} value={region}>
                  {region} · {RIOT_REGION_LABELS[region]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Sync mode</span>
          <select
            value={syncMode}
            onChange={(event) => onSyncModeChange(event.target.value as LiveDraftSyncMode)}
            className="w-full rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400/40"
          >
            {Object.entries(LIVE_DRAFT_SYNC_MODE_LABELS).map(([mode, label]) => (
              <option key={mode} value={mode}>
                {label}
              </option>
            ))}
          </select>
          <p className="text-xs leading-5 text-slate-500">{syncModeHelpText}</p>
        </label>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Live status indicator</p>
          <div className="mt-3 flex items-center gap-3">
            <span className={`h-3 w-3 rounded-full ${liveStatusIndicator.tone}`} />
            <div>
              <p className="text-sm font-medium text-white">{liveStatusIndicator.label}</p>
              <p className="text-xs text-slate-400">{liveStatusIndicator.description}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Session status</p>
          <p className="mt-2 text-sm font-medium text-white">
            {session.player
              ? `${session.player.gameName}#${session.player.tagLine} · ${session.player.region}`
              : syncMode === 'DESKTOP_CLIENT'
                ? 'No desktop session yet'
                : 'No player session yet'}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">{session.message}</p>
          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">
            Status: {session.status} · Mode: {LIVE_DRAFT_SYNC_MODE_LABELS[session.syncMode]}
          </p>
          {session.sessionId ? (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>
                Session ID: <code>{session.sessionId}</code>
              </span>
              <button
                type="button"
                onClick={() => void copyText(session.sessionId!, 'Session id copied.')}
                className="rounded-lg border border-slate-700 px-2 py-1 text-[11px] font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-900"
              >
                Copy session id
              </button>
            </div>
          ) : null}
          {session.lastSyncAt ? (
            <p className="mt-2 text-xs text-slate-500">Last sync: {new Date(session.lastSyncAt).toLocaleString()}</p>
          ) : null}
          {copyFeedback ? <p className="mt-2 text-xs text-cyan-300">{copyFeedback}</p> : null}
        </div>

        {isLiveLikeMode ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Live snapshot debug</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Source</p>
                <p className="mt-1 text-sm text-white">{snapshotDebugSource ?? 'Unknown'}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Snapshot mapped</p>
                <p className="mt-1 text-sm text-white">{snapshotMappedLabel}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Last snapshot time</p>
                <p className="mt-1 text-sm text-white">
                  {session.snapshotDebug?.lastSnapshotAt
                    ? new Date(session.snapshotDebug.lastSnapshotAt).toLocaleString()
                    : 'No snapshot recorded yet'}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Last mapping failure reason</p>
                <p className="mt-1 text-sm leading-6 text-slate-300">{snapshotFailureReason}</p>
              </div>
            </div>
          </div>
        ) : null}

        {syncMode === 'RIOT_API' && riotLookupSteps.length > 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Riot lookup diagnostics</p>
            {riotPipelineSummary.length > 0 ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {riotPipelineSummary.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
                    <p className={`mt-2 text-sm font-semibold ${item.tone}`}>{item.value}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{item.description}</p>
                  </div>
                ))}
              </div>
            ) : null}
            <div className="mt-3 space-y-3">
              {riotLookupSteps.map(({ label, step }) => {
                const presentation = getRiotLookupStatusPresentation(step.status)

                return (
                  <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-white">{label}</p>
                      <span className={`text-xs font-semibold uppercase tracking-[0.18em] ${presentation.tone}`}>
                        {presentation.label}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{step.details ?? 'No extra details recorded for this step.'}</p>
                  </div>
                )
              })}
            </div>
          </div>
        ) : null}

        {syncMode === 'RIOT_API' ? (
          <div className="rounded-2xl border border-amber-900/60 bg-amber-950/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Riot troubleshooting</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-300">
              {riotTroubleshootingItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {syncMode === 'DESKTOP_CLIENT' ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">How to start the companion</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Open another terminal after starting a desktop session, then run one of these commands with the active session id.
            </p>
            <div className="mt-3 space-y-2">
              {companionCommands.map((command) => (
                <div key={command} className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2">
                  <div className="flex items-start justify-between gap-3">
                    <pre className="overflow-x-auto text-xs text-cyan-200"><code>{command}</code></pre>
                    {session.sessionId ? (
                      <button
                        type="button"
                        onClick={() => void copyText(command, 'Companion command copied.')}
                        className="shrink-0 rounded-lg border border-slate-700 px-2 py-1 text-[11px] font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-900"
                      >
                        Copy
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <button
                type="button"
                onClick={onTriggerDesktopMockSequence}
                disabled={!session.sessionId}
                className="rounded-2xl border border-cyan-700 px-4 py-3 text-sm font-semibold text-cyan-200 transition hover:border-cyan-500 hover:bg-cyan-950/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Test desktop mock now
              </button>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            {isLiveLikeMode ? 'Start live sync' : 'Start manual session'}
          </button>

          <button
            type="button"
            onClick={onStopSession}
            className="rounded-2xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-900"
          >
            Stop session
          </button>
        </div>
      </form>
    </Panel>
  )
}
