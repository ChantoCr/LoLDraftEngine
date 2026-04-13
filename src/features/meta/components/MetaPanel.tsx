import { PRODUCT_MODE_LABELS, RECOMMENDATION_MODE_LABELS } from '@/domain/draft/constants'
import type { DraftState } from '@/domain/draft/types'
import { Panel } from '@/shared/ui/Panel'

interface MetaPanelProps {
  draftState: DraftState
}

export function MetaPanel({ draftState }: MetaPanelProps) {
  const items = [
    { label: 'Patch', value: draftState.patchVersion },
    { label: 'Mode', value: PRODUCT_MODE_LABELS[draftState.productMode] },
    { label: 'Recommendation mode', value: RECOMMENDATION_MODE_LABELS[draftState.recommendationMode] },
    { label: 'Current role', value: draftState.currentPickRole },
    { label: 'Available candidates', value: String(draftState.availableChampionIds.length) },
  ]

  return (
    <Panel
      eyebrow="Draft Context"
      title="Meta snapshot"
      subtitle="Mode, patch, and recommendation state live at the draft boundary so the engine can remain deterministic."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
            <p className="mt-2 text-sm font-medium text-slate-200">{item.value}</p>
          </div>
        ))}
      </div>
    </Panel>
  )
}
