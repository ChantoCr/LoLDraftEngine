import type { Champion, Role } from '@/domain/champion/types'
import { ROLE_ORDER } from '@/domain/draft/constants'
import { getUnavailableChampionIds } from '@/domain/draft/selectors'
import type { DraftState, TeamDraft, TeamSide } from '@/domain/draft/types'
import { Panel } from '@/shared/ui/Panel'

interface DraftBoardProps {
  draftState: DraftState
  championsById: Record<string, Champion>
  onAssignChampion: (side: TeamSide, role: Role, championId: string) => void
  onClearChampion: (side: TeamSide, role: Role) => void
  onSelectCurrentRole: (role: Role) => void
}

function getChampionName(championsById: Record<string, Champion>, championId?: string) {
  if (!championId) {
    return 'Open slot'
  }

  return championsById[championId]?.name ?? championId
}

function getRoleSlot(teamDraft: TeamDraft, role: Role) {
  return teamDraft.picks.find((slot) => slot.role === role)
}

function getRoleChampionOptions(
  championsById: Record<string, Champion>,
  unavailableChampionIds: string[],
  role: Role,
  selectedChampionId?: string,
) {
  return Object.values(championsById)
    .filter(
      (champion) =>
        champion.roles.includes(role) &&
        (!unavailableChampionIds.includes(champion.id) || champion.id === selectedChampionId),
    )
    .sort((left, right) => left.name.localeCompare(right.name))
}

function TeamColumn({
  label,
  tone,
  teamDraft,
  draftState,
  championsById,
  onAssignChampion,
  onClearChampion,
  onSelectCurrentRole,
}: {
  label: string
  tone: 'ally' | 'enemy'
  teamDraft: TeamDraft
  draftState: DraftState
  championsById: Record<string, Champion>
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
        const championName = getChampionName(championsById, slot?.championId)
        const options = getRoleChampionOptions(championsById, unavailableChampionIds, role, slot?.championId)
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

            <div className="mt-3 flex gap-2">
              <select
                value={slot?.championId ?? ''}
                onChange={(event) => {
                  if (!event.target.value) {
                    onClearChampion(side, role)
                    return
                  }

                  onAssignChampion(side, role, event.target.value)
                }}
                className="w-full rounded-2xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-400/40"
              >
                <option value="">Open slot</option>
                {options.map((champion) => (
                  <option key={`${role}-${champion.id}`} value={champion.id}>
                    {champion.name}
                  </option>
                ))}
              </select>

              {slot?.championId ? (
                <button
                  type="button"
                  onClick={() => onClearChampion(side, role)}
                  className="rounded-2xl border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-slate-500 hover:bg-slate-900"
                >
                  Clear
                </button>
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function DraftBoard({
  draftState,
  championsById,
  onAssignChampion,
  onClearChampion,
  onSelectCurrentRole,
}: DraftBoardProps) {
  return (
    <Panel
      eyebrow="Live Draft Builder"
      title="Draft board"
      subtitle="Interactive manual drafting is live. Pick champions by role, switch the current pick role, and recompute recommendations instantly."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <TeamColumn
          label="Ally team"
          tone="ally"
          teamDraft={draftState.allyTeam}
          draftState={draftState}
          championsById={championsById}
          onAssignChampion={onAssignChampion}
          onClearChampion={onClearChampion}
          onSelectCurrentRole={onSelectCurrentRole}
        />
        <TeamColumn
          label="Enemy team"
          tone="enemy"
          teamDraft={draftState.enemyTeam}
          draftState={draftState}
          championsById={championsById}
          onAssignChampion={onAssignChampion}
          onClearChampion={onClearChampion}
          onSelectCurrentRole={onSelectCurrentRole}
        />
      </div>
    </Panel>
  )
}
