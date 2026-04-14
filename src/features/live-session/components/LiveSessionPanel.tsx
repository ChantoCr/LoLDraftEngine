import type { ChangeEvent, FormEvent } from 'react'
import { LIVE_DRAFT_SYNC_MODE_LABELS, RIOT_REGION_LABELS, RIOT_REGIONS } from '@/domain/live/constants'
import type { LiveDraftSession, LiveDraftSyncMode, SummonerIdentity } from '@/domain/live/types'
import { Panel } from '@/shared/ui/Panel'

interface LiveSessionPanelProps {
  identity: SummonerIdentity
  session: LiveDraftSession
  syncMode: LiveDraftSyncMode
  onIdentityChange: (identity: SummonerIdentity) => void
  onSyncModeChange: (syncMode: LiveDraftSyncMode) => void
  onStartSession: () => void
  onStopSession: () => void
}

export function LiveSessionPanel({
  identity,
  session,
  syncMode,
  onIdentityChange,
  onSyncModeChange,
  onStartSession,
  onStopSession,
}: LiveSessionPanelProps) {
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

  const isLiveLikeMode = syncMode !== 'MANUAL'

  return (
    <Panel
      eyebrow="Live Draft Session"
      title="Summoner session"
      subtitle="The project can support all Riot regions, including LAN. Manual editing is live now, and Riot / desktop sync use the same provider contract for future real integrations."
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="space-y-2 sm:col-span-1">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Game name</span>
            <input
              value={identity.gameName}
              onChange={updateField('gameName')}
              placeholder="PlayerName"
              className="w-full rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400/40"
            />
          </label>
          <label className="space-y-2 sm:col-span-1">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Tag line</span>
            <input
              value={identity.tagLine}
              onChange={updateField('tagLine')}
              placeholder="LAN"
              className="w-full rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400/40"
            />
          </label>
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
        </label>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Session status</p>
          <p className="mt-2 text-sm font-medium text-white">
            {session.player
              ? `${session.player.gameName}#${session.player.tagLine} · ${session.player.region}`
              : 'No player session yet'}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">{session.message}</p>
          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">
            Status: {session.status} · Mode: {LIVE_DRAFT_SYNC_MODE_LABELS[session.syncMode]}
          </p>
          {session.lastSyncAt ? (
            <p className="mt-2 text-xs text-slate-500">Last sync: {new Date(session.lastSyncAt).toLocaleString()}</p>
          ) : null}
        </div>

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
