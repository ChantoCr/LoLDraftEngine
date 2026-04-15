import type { Role } from '@/domain/champion/types'
import type { ChampionCatalogEntry } from '@/domain/champion/catalog'
import { ROLE_ORDER } from '@/domain/draft/constants'
import { getUnavailableChampionIds } from '@/domain/draft/selectors'
import type { DraftState, TeamDraft, TeamSide } from '@/domain/draft/types'
import { Panel } from '@/shared/ui/Panel'
import { ChampionSearchSelect } from './ChampionSearchSelect'

interface DraftBoardProps {
  draftState: DraftState
  championCatalog: ChampionCatalogEntry[]
  championNamesById: Record<string, string>
  dataWarnings?: string[]
  onAssignChampion: (side: TeamSide, role: Role, championId: string) => void
  onClearChampion: (side: TeamSide, role: Role) => void
  onSelectCurrentRole: (role: Role) => void
}

function getChampionName(championNamesById: Record<string, string>, championId?: string) {
  if (!championId) {
    return 'Open slot'
  }

  return championNamesById[championId] ?? championId
}

function getRoleSlot(teamDraft: TeamDraft, role: Role) {
  return teamDraft.picks.find((slot) => slot.role === role)
}

function TeamColumn({
  label,
  tone,
  teamDraft,
  draftState,
  championCatalog,
  championNamesById,
  onAssignChampion,
  onClearChampion,
  onSelectCurrentRole,
}: {
  label: string
  tone: 'ally' | 'enemy'
  teamDraft: TeamDraft
  draftState: DraftState
  championCatalog: ChampionCatalogEntry[]
  championNamesById: Record<string, string>
  onAssignChampion: (side: TeamSide, role: Role, championId: string) => void
  onClearChampion: (side: TeamSide, role: Role) => void
  onSelectCurrentRole: (role: Role) => void
}) {
  const toneClasses =
    tone === 'ally'
      ? 'border-cyan-400/20 bg-cyan-400/5 text-cyan-200'
      : 'border-rose-400/20 bg-rose-400/5 text-rose-200'
  const unavailableChampionIds = getUnavailableChampionIds(draftState)
  const side: TeamSide = tone === 'ally' ? 'ALLY' : 'ENEMY'

  return (
    <div className="space-y-3">
      <div className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${toneClasses}`}>{label}</div>

      {ROLE_ORDER.map((role) => {
        const slot = getRoleSlot(teamDraft, role)
        const championName = getChampionName(championNamesById, slot?.championId)
        const isCurrentRole = draftState.currentPickRole === role

        return (
          <div
            key={`${label}-${role}`}
            className={`rounded-2xl border bg-slate-950/60 p-4 ${
              isCurrentRole ? 'border-cyan-400/40' : 'border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => onSelectCurrentRole(role)}
                className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 transition hover:text-cyan-300"
              >
                {role}
              </button>
              <span className="text-xs text-slate-500">{slot?.isLocked ? 'Locked' : 'Pending'}</span>
            </div>
            <div className="mt-2 text-lg font-medium text-white">{championName}</div>

            <div className="mt-3">
              <ChampionSearchSelect
                role={role}
                selectedChampionId={slot?.championId}
                options={championCatalog}
                disabledChampionIds={unavailableChampionIds}
                onSelectChampion={(championId) => onAssignChampion(side, role, championId)}
                onClearChampion={() => onClearChampion(side, role)}
                placeholder={`Search any champion for ${role.toLowerCase()}...`}
                restrictToRole={false}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function DraftBoard({
  draftState,
  championCatalog,
  championNamesById,
  dataWarnings = [],
  onAssignChampion,
  onClearChampion,
  onSelectCurrentRole,
}: DraftBoardProps) {
  return (
    <Panel
      eyebrow="Live Draft Builder"
      title="Draft board"
      subtitle="Interactive manual drafting is live. Every champion can now be searched in every lane from a single combobox, and recommendations recompute instantly."
    >
      <div className="space-y-4">
        {dataWarnings.length > 0 ? (
          <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-amber-100" role="alert">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">Data sync warning</p>
            <p className="mt-2 text-sm text-amber-50">
              Manual draft interactions are still available, but one or more backend calls failed. Current fallback data remains active.
            </p>
            <div className="mt-3 space-y-2">
              {dataWarnings.map((warning) => (
                <pre
                  key={warning}
                  className="overflow-x-auto rounded-2xl border border-amber-300/20 bg-slate-950/40 px-3 py-2 text-xs whitespace-pre-wrap break-words text-amber-100"
                >
                  {warning}
                </pre>
              ))}
            </div>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <TeamColumn
            label="Ally team"
            tone="ally"
            teamDraft={draftState.allyTeam}
            draftState={draftState}
            championCatalog={championCatalog}
            championNamesById={championNamesById}
            onAssignChampion={onAssignChampion}
            onClearChampion={onClearChampion}
            onSelectCurrentRole={onSelectCurrentRole}
          />
          <TeamColumn
            label="Enemy team"
            tone="enemy"
            teamDraft={draftState.enemyTeam}
            draftState={draftState}
            championCatalog={championCatalog}
            championNamesById={championNamesById}
            onAssignChampion={onAssignChampion}
            onClearChampion={onClearChampion}
            onSelectCurrentRole={onSelectCurrentRole}
          />
        </div>
      </div>
    </Panel>
  )
}
