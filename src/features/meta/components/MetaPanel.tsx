import type { Role } from '@/domain/champion/types'
import { PRODUCT_MODE_LABELS, RECOMMENDATION_MODE_LABELS, ROLE_ORDER } from '@/domain/draft/constants'
import type { DraftState, RecommendationMode } from '@/domain/draft/types'
import { Panel } from '@/shared/ui/Panel'

interface MetaPanelProps {
  draftState: DraftState
  onRecommendationModeChange: (recommendationMode: RecommendationMode) => void
  onCurrentRoleChange: (role: Role) => void
}

export function MetaPanel({
  draftState,
  onRecommendationModeChange,
  onCurrentRoleChange,
}: MetaPanelProps) {
  const items = [
    { label: 'Patch', value: draftState.patchVersion },
    { label: 'Mode', value: PRODUCT_MODE_LABELS[draftState.productMode] },
    { label: 'Available candidates', value: String(draftState.availableChampionIds.length) },
  ]

  return (
    <Panel
      eyebrow="Draft Context"
      title="Meta snapshot"
      subtitle="Recommendation mode and current role are now interactive draft controls, while the engine remains deterministic."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
            <p className="mt-2 text-sm font-medium text-slate-200">{item.value}</p>
          </div>
        ))}

        <label className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Recommendation mode</p>
          <select
            value={draftState.recommendationMode}
            onChange={(event) => onRecommendationModeChange(event.target.value as RecommendationMode)}
            className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-400/40"
          >
            {Object.entries(RECOMMENDATION_MODE_LABELS).map(([mode, label]) => (
              <option key={mode} value={mode}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Current role</p>
          <select
            value={draftState.currentPickRole}
            onChange={(event) => onCurrentRoleChange(event.target.value as Role)}
            className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-400/40"
          >
            {ROLE_ORDER.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </label>
      </div>
    </Panel>
  )
}
