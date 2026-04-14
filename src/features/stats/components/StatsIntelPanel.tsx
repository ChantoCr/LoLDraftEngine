import type { Champion } from '@/domain/champion/types'
import type { Role } from '@/domain/champion/types'
import type { PatchDataBundle } from '@/domain/stats/types'
import { Panel } from '@/shared/ui/Panel'

interface StatsIntelPanelProps {
  statsBundle: PatchDataBundle
  currentRole: Role
  championsById: Record<string, Champion>
}

const tierOrder = { S: 5, A: 4, B: 3, C: 2, D: 1 }

export function StatsIntelPanel({ statsBundle, currentRole, championsById }: StatsIntelPanelProps) {
  const topRoleMeta = [...statsBundle.metaSignals]
    .filter((signal) => signal.role === currentRole)
    .sort((left, right) => {
      const tierGap = (tierOrder[right.tier ?? 'D'] ?? 0) - (tierOrder[left.tier ?? 'D'] ?? 0)
      if (tierGap !== 0) {
        return tierGap
      }

      return (right.winRate ?? 0) - (left.winRate ?? 0)
    })
    .slice(0, 3)

  const sources = [...new Set(statsBundle.freshness.map((entry) => entry.source))]

  return (
    <Panel
      eyebrow="Stats Layer"
      title="Patch intelligence"
      subtitle="Confidence-aware meta, matchup, and synergy signals are available as structured inputs for deterministic scoring."
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Patch</p>
            <p className="mt-2 text-sm font-medium text-slate-200">{statsBundle.patchVersion}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Sources</p>
            <p className="mt-2 text-sm font-medium text-slate-200">{sources.join(', ') || 'None'}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Top {currentRole} meta signals</p>
          <div className="mt-3 space-y-3">
            {topRoleMeta.length > 0 ? (
              topRoleMeta.map((signal) => {
                const championName =
                  statsBundle.championsById[signal.championId]?.name ?? championsById[signal.championId]?.name ?? signal.championId

                return (
                  <div key={`${signal.championId}-${signal.role}`} className="rounded-2xl border border-slate-800 bg-slate-900/80 px-3 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white">{championName}</p>
                      <span className="rounded-full border border-slate-700 px-2.5 py-1 text-xs text-slate-300">
                        Tier {signal.tier ?? 'N/A'}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-300">
                      WR {((signal.winRate ?? 0) * 100).toFixed(1)}% · PR {((signal.pickRate ?? 0) * 100).toFixed(1)}%
                      {' '}· Confidence {signal.confidence.level}
                    </p>
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-slate-400">No structured role meta signals loaded yet for this role.</p>
            )}
          </div>
        </div>
      </div>
    </Panel>
  )
}
