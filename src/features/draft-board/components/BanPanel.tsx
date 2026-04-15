import type { Role } from '@/domain/champion/types'
import type { ChampionCatalogEntry } from '@/domain/champion/catalog'
import { getUnavailableChampionIds } from '@/domain/draft/selectors'
import type { DraftState, TeamSide } from '@/domain/draft/types'
import { Panel } from '@/shared/ui/Panel'
import { ChampionSearchSelect } from './ChampionSearchSelect'

interface BanPanelProps {
  draftState: DraftState
  championCatalog: ChampionCatalogEntry[]
  championNamesById: Record<string, string>
  onAddBan: (side: TeamSide, championId: string) => void
  onRemoveBan: (side: TeamSide, championId: string) => void
}

const DEFAULT_ROLE_FOR_BAN_SEARCH: Role = 'TOP'

function BanColumn({
  title,
  side,
  bans,
  championCatalog,
  championNamesById,
  disabledChampionIds,
  onAddBan,
  onRemoveBan,
}: {
  title: string
  side: TeamSide
  bans: string[]
  championCatalog: ChampionCatalogEntry[]
  championNamesById: Record<string, string>
  disabledChampionIds: string[]
  onAddBan: (side: TeamSide, championId: string) => void
  onRemoveBan: (side: TeamSide, championId: string) => void
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-1 text-xs text-slate-500">Optional bans with search + autofill.</p>
      </div>

      <ChampionSearchSelect
        role={DEFAULT_ROLE_FOR_BAN_SEARCH}
        options={championCatalog}
        disabledChampionIds={disabledChampionIds}
        onSelectChampion={(championId) => onAddBan(side, championId)}
        placeholder="Search ban target..."
        restrictToRole={false}
      />

      <div className="flex flex-wrap gap-2">
        {bans.length > 0 ? (
          bans.map((championId) => (
            <button
              key={`${side}-${championId}`}
              type="button"
              onClick={() => onRemoveBan(side, championId)}
              className="rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-1 text-xs text-rose-200 transition hover:bg-rose-400/20"
            >
              {championNamesById[championId] ?? championId} ×
            </button>
          ))
        ) : (
          <p className="text-xs text-slate-500">No bans added.</p>
        )}
      </div>
    </div>
  )
}

export function BanPanel({
  draftState,
  championCatalog,
  championNamesById,
  onAddBan,
  onRemoveBan,
}: BanPanelProps) {
  const disabledChampionIds = getUnavailableChampionIds(draftState)

  return (
    <Panel
      eyebrow="Draft Controls"
      title="Bans"
      subtitle="Add optional ally and enemy bans. Draft-state recomputation and recommendation eligibility update immediately."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <BanColumn
          title="Ally bans"
          side="ALLY"
          bans={draftState.allyTeam.bans}
          championCatalog={championCatalog}
          championNamesById={championNamesById}
          disabledChampionIds={disabledChampionIds}
          onAddBan={onAddBan}
          onRemoveBan={onRemoveBan}
        />
        <BanColumn
          title="Enemy bans"
          side="ENEMY"
          bans={draftState.enemyTeam.bans}
          championCatalog={championCatalog}
          championNamesById={championNamesById}
          disabledChampionIds={disabledChampionIds}
          onAddBan={onAddBan}
          onRemoveBan={onRemoveBan}
        />
      </div>
    </Panel>
  )
}
