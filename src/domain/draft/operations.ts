import type { Role } from '@/domain/champion/types'
import { unique } from '@/domain/common/math'
import { getDraftSlot } from '@/domain/draft/selectors'
import type {
  DraftState,
  ProductMode,
  RecommendationMode,
  TeamDraft,
  TeamSide,
} from '@/domain/draft/types'

function updateTeamDraftSlot(
  teamDraft: TeamDraft,
  role: Role,
  updater: (championId?: string) => { championId?: string; isLocked: boolean },
): TeamDraft {
  return {
    ...teamDraft,
    picks: teamDraft.picks.map((slot) => {
      if (slot.role !== role) {
        return slot
      }

      const nextSlot = updater(slot.championId)

      return {
        role: slot.role,
        championId: nextSlot.championId,
        isLocked: nextSlot.isLocked,
      }
    }),
  }
}

function withAvailableChampionIds(
  draftState: DraftState,
  previousChampionId: string | undefined,
  nextChampionId: string | undefined,
) {
  const nextAvailableChampionIds = draftState.availableChampionIds.filter(
    (championId) => championId !== nextChampionId,
  )

  if (previousChampionId && !nextAvailableChampionIds.includes(previousChampionId)) {
    nextAvailableChampionIds.push(previousChampionId)
  }

  return {
    ...draftState,
    availableChampionIds: unique(nextAvailableChampionIds),
  }
}

export function assignChampionToSlot(
  draftState: DraftState,
  side: TeamSide,
  role: Role,
  championId: string,
  isLocked = true,
): DraftState {
  const teamDraft = side === 'ALLY' ? draftState.allyTeam : draftState.enemyTeam
  const previousChampionId = getDraftSlot(teamDraft, role)?.championId
  const nextTeamDraft = updateTeamDraftSlot(teamDraft, role, () => ({ championId, isLocked }))
  const nextDraftState = {
    ...draftState,
    allyTeam: side === 'ALLY' ? nextTeamDraft : draftState.allyTeam,
    enemyTeam: side === 'ENEMY' ? nextTeamDraft : draftState.enemyTeam,
  }

  return withAvailableChampionIds(nextDraftState, previousChampionId, championId)
}

export function clearChampionFromSlot(draftState: DraftState, side: TeamSide, role: Role): DraftState {
  const teamDraft = side === 'ALLY' ? draftState.allyTeam : draftState.enemyTeam
  const previousChampionId = getDraftSlot(teamDraft, role)?.championId
  const nextTeamDraft = updateTeamDraftSlot(teamDraft, role, () => ({ championId: undefined, isLocked: false }))
  const nextDraftState = {
    ...draftState,
    allyTeam: side === 'ALLY' ? nextTeamDraft : draftState.allyTeam,
    enemyTeam: side === 'ENEMY' ? nextTeamDraft : draftState.enemyTeam,
  }

  return withAvailableChampionIds(nextDraftState, previousChampionId, undefined)
}

export function addBan(draftState: DraftState, side: TeamSide, championId: string): DraftState {
  const teamDraft = side === 'ALLY' ? draftState.allyTeam : draftState.enemyTeam
  const nextTeamDraft = {
    ...teamDraft,
    bans: unique([...teamDraft.bans, championId]),
  }

  return {
    ...draftState,
    allyTeam: side === 'ALLY' ? nextTeamDraft : draftState.allyTeam,
    enemyTeam: side === 'ENEMY' ? nextTeamDraft : draftState.enemyTeam,
    availableChampionIds: draftState.availableChampionIds.filter((availableId) => availableId !== championId),
  }
}

export function removeBan(draftState: DraftState, side: TeamSide, championId: string): DraftState {
  const teamDraft = side === 'ALLY' ? draftState.allyTeam : draftState.enemyTeam
  const nextTeamDraft = {
    ...teamDraft,
    bans: teamDraft.bans.filter((bannedId) => bannedId !== championId),
  }

  return {
    ...draftState,
    allyTeam: side === 'ALLY' ? nextTeamDraft : draftState.allyTeam,
    enemyTeam: side === 'ENEMY' ? nextTeamDraft : draftState.enemyTeam,
  }
}

export function setRecommendationMode(
  draftState: DraftState,
  recommendationMode: RecommendationMode,
): DraftState {
  return {
    ...draftState,
    recommendationMode,
  }
}

export function setCurrentPickRole(draftState: DraftState, currentPickRole: Role): DraftState {
  return {
    ...draftState,
    currentPickRole,
  }
}

export function setProductMode(draftState: DraftState, productMode: ProductMode): DraftState {
  return {
    ...draftState,
    productMode,
  }
}

export function setAvailableChampionIds(
  draftState: DraftState,
  availableChampionIds: string[],
): DraftState {
  return {
    ...draftState,
    availableChampionIds: unique(availableChampionIds),
  }
}
