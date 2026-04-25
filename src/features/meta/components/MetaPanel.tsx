import type { Role } from '@/domain/champion/types'
import { PRODUCT_MODE_LABELS, ROLE_ORDER } from '@/domain/draft/constants'
import type { DraftState } from '@/domain/draft/types'
import { Panel } from '@/shared/ui/Panel'

interface MetaPanelProps {
  draftState: DraftState
  selectedPatchVersion: string
  availablePatchVersions: string[]
  isPatchVersionsLoading?: boolean
  patchVersionsError?: string
  onPatchVersionChange: (patchVersion: string) => void
  onCurrentRoleChange: (role: Role) => void
}

export function MetaPanel({
  draftState,
  selectedPatchVersion,
  availablePatchVersions,
  isPatchVersionsLoading = false,
  patchVersionsError,
  onPatchVersionChange,
  onCurrentRoleChange,
}: MetaPanelProps) {
  const items = [
    { label: 'Loaded patch', value: draftState.patchVersion },
    { label: 'Mode', value: PRODUCT_MODE_LABELS[draftState.productMode] },
    { label: 'Queue', value: draftState.queueContext?.label ?? 'Manual / unknown' },
    { label: 'Available candidates', value: String(draftState.availableChampionIds.length) },
  ]

  const patchOptions = ['latest', ...availablePatchVersions.filter((patchVersion) => patchVersion !== 'latest')]

  return (
    <Panel
      eyebrow="Draft Context"
      title="Meta snapshot"
      subtitle="Patch and role stay interactive draft controls, while recommendation view switching now lives directly in the recommendation panel tabs."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
            <p className="mt-2 text-sm font-medium text-slate-200">{item.value}</p>
          </div>
        ))}

        <label className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Requested patch</p>
          <select
            value={selectedPatchVersion}
            onChange={(event) => onPatchVersionChange(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-400/40"
          >
            {patchOptions.map((patchVersion) => (
              <option key={patchVersion} value={patchVersion}>
                {patchVersion === 'latest' ? 'latest · newest Data Dragon patch' : patchVersion}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            {isPatchVersionsLoading
              ? 'Refreshing available Data Dragon versions...'
              : selectedPatchVersion === 'latest'
                ? `Latest mode is active. The resolved patch currently loaded is ${draftState.patchVersion}.`
                : `Patch ${selectedPatchVersion} is requested. The resolved patch currently loaded is ${draftState.patchVersion}.`}
          </p>
          {patchVersionsError ? <p className="mt-2 text-xs text-amber-300">{patchVersionsError}</p> : null}
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
