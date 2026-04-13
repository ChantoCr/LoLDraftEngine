import type { ChampionPoolProfile, ChampionPoolTier } from '@/domain/champion-pool/types'
import type { Champion } from '@/domain/champion/types'
import { Panel } from '@/shared/ui/Panel'

interface ChampionPoolPanelProps {
  championPool: ChampionPoolProfile
  championsById: Record<string, Champion>
}

const tierLabels: Record<ChampionPoolTier, string> = {
  MAIN: 'Main',
  COMFORT: 'Comfort',
  PLAYABLE: 'Playable',
  EMERGENCY: 'Emergency',
}

export function ChampionPoolPanel({ championPool, championsById }: ChampionPoolPanelProps) {
  return (
    <Panel
      eyebrow="Champion Pool Advisor"
      title={championPool.playerLabel}
      subtitle="Personal-pool logic stays optional and explicit instead of being mixed into baseline recommendation scoring."
    >
      <div className="space-y-3">
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
