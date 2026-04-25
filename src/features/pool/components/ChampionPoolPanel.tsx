import type { ChampionPoolAdvice, ChampionPoolProfile, ChampionPoolTier } from '@/domain/champion-pool/types'
import type { Champion } from '@/domain/champion/types'
import { Panel } from '@/shared/ui/Panel'

interface ChampionPoolPanelProps {
  championPool: ChampionPoolProfile
  championsById: Record<string, Champion>
  isLoading?: boolean
  error?: string
  advice?: ChampionPoolAdvice
}

const tierLabels: Record<ChampionPoolTier, string> = {
  MAIN: 'Main',
  COMFORT: 'Comfort',
  PLAYABLE: 'Playable',
  EMERGENCY: 'Emergency',
}

export function ChampionPoolPanel({ championPool, championsById, isLoading = false, error, advice }: ChampionPoolPanelProps) {
  return (
    <Panel
      eyebrow="Champion Pool Advisor"
      title={championPool.playerLabel}
      subtitle="Personal-pool logic stays optional and explicit instead of being mixed into baseline recommendation scoring."
    >
      <div className="space-y-3">
        {championPool.source === 'RIOT_API' ? (
          <p className="rounded-2xl border border-cyan-900/60 bg-cyan-950/20 p-3 text-xs leading-6 text-cyan-100">
            Auto-detected from Riot account mastery data for the current role.
          </p>
        ) : null}
        {advice ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Pool advisor</p>
            <p className="mt-2 text-sm font-medium text-white">Decision: {advice.decision.replaceAll('_', ' ')}</p>
            <p className="mt-2 text-sm text-slate-400">Strategic gap: {advice.strategicGapScore}</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
              {advice.rationale.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
            {advice.coverageGaps.length > 0 ? (
              <div className="mt-3 rounded-2xl border border-amber-900/60 bg-amber-950/20 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">Coverage gaps</p>
                <ul className="mt-2 space-y-1 text-sm text-slate-300">
                  {advice.coverageGaps.map((gap) => (
                    <li key={gap}>• {gap}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
        {isLoading ? <p className="text-sm text-slate-400">Refreshing detected champion pool...</p> : null}
        {error ? <p className="text-sm text-amber-300">{error}</p> : null}
        {championPool.entries.map((entry) => {
          const championName = championsById[entry.championId]?.name ?? entry.championId

          return (
            <div key={entry.championId} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-white">{championName}</p>
                <span className="rounded-full border border-slate-700 px-2.5 py-1 text-xs text-slate-300">
                  {tierLabels[entry.tier]}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-400">
                Mastery confidence: {Math.round(entry.masteryConfidence * 100)}%
              </p>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}
