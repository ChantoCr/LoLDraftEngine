import type { Champion, Role } from '@/domain/champion/types'
import { ROLE_ORDER } from '@/domain/draft/constants'
import type { DraftState, TeamDraft } from '@/domain/draft/types'
import { Panel } from '@/shared/ui/Panel'

interface DraftBoardProps {
  draftState: DraftState
  championsById: Record<string, Champion>
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

function TeamColumn({
  label,
  tone,
  teamDraft,
  championsById,
}: {
  label: string
  tone: 'ally' | 'enemy'
  teamDraft: TeamDraft
  championsById: Record<string, Champion>
}) {
  const toneClasses =
    tone === 'ally'
      ? 'border-cyan-400/20 bg-cyan-400/5 text-cyan-200'
      : 'border-rose-400/20 bg-rose-400/5 text-rose-200'

  return (
    <div className="space-y-3">
      <div className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${toneClasses}`}>{label}</div>

      {ROLE_ORDER.map((role) => {
        const slot = getRoleSlot(teamDraft, role)
        const championName = getChampionName(championsById, slot?.championId)

        return (
          <div key={`${label}-${role}`} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{role}</span>
              <span className="text-xs text-slate-500">{slot?.isLocked ? 'Locked' : 'Pending'}</span>
            </div>
            <div className="mt-2 text-lg font-medium text-white">{championName}</div>
          </div>
        )
      })}
    </div>
  )
}

export function DraftBoard({ draftState, championsById }: DraftBoardProps) {
  return (
    <Panel
      eyebrow="Live Draft Builder"
      title="Draft board"
      subtitle="A UI-facing scaffold backed by serializable draft state types and deterministic recomputation."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <TeamColumn
          label="Ally team"
          tone="ally"
          teamDraft={draftState.allyTeam}
          championsById={championsById}
        />
        <TeamColumn
          label="Enemy team"
          tone="enemy"
          teamDraft={draftState.enemyTeam}
          championsById={championsById}
        />
      </div>
    </Panel>
  )
}
