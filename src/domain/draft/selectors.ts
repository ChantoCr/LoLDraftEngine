import type { Role } from '@/domain/champion/types'
import type { DraftSlot, DraftState, TeamDraft, TeamSide } from '@/domain/draft/types'
import { unique } from '@/domain/common/math'

export function getTeamDraft(draftState: DraftState, side: TeamSide): TeamDraft {
  return side === 'ALLY' ? draftState.allyTeam : draftState.enemyTeam
}

export function getDraftSlot(teamDraft: TeamDraft, role: Role): DraftSlot | undefined {
  return teamDraft.picks.find((slot) => slot.role === role)
}

export function getPickedChampionIds(draftState: DraftState, side?: TeamSide) {
  const teamDrafts = side ? [getTeamDraft(draftState, side)] : [draftState.allyTeam, draftState.enemyTeam]

  return teamDrafts.flatMap((teamDraft) =>
    teamDraft.picks.flatMap((slot) => (slot.championId ? [slot.championId] : [])),
  )
}

export function getBannedChampionIds(draftState: DraftState) {
  return unique([...draftState.allyTeam.bans, ...draftState.enemyTeam.bans])
}

export function getUnavailableChampionIds(draftState: DraftState) {
  return unique([...getPickedChampionIds(draftState), ...getBannedChampionIds(draftState)])
}

export function isChampionAvailable(draftState: DraftState, championId: string) {
  return (
    draftState.availableChampionIds.includes(championId) &&
    !getUnavailableChampionIds(draftState).includes(championId)
  )
}

export function getOpenRoles(teamDraft: TeamDraft) {
  return teamDraft.picks.flatMap((slot) => (slot.championId ? [] : [slot.role]))
}

export function countFilledSlots(teamDraft: TeamDraft) {
  return teamDraft.picks.filter((slot) => Boolean(slot.championId)).length
}
