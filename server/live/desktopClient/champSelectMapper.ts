import type { Role } from '@/domain/champion/types'
import { ROLE_ORDER } from '@/domain/draft/constants'
import { createDraftState } from '@/domain/draft/factories'
import type { DraftState } from '@/domain/draft/types'
import type { DesktopChampSelectMapperContext } from '@server/live/desktopClient/source'

export type LcuChampSelectActionType = 'pick' | 'ban' | string

export interface LcuChampSelectAction {
  id?: number
  actorCellId: number
  championId: number
  completed: boolean
  isInProgress?: boolean
  type: LcuChampSelectActionType
  pickTurn?: number
}

export interface LcuChampSelectTeamMember {
  cellId: number
  assignedPosition?: string
  championId?: number
  championPickIntent?: number
}

export interface LcuChampSelectBans {
  myTeamBans?: number[]
  theirTeamBans?: number[]
}

export interface LcuChampSelectTimer {
  phase?: string
  internalNowInEpochMs?: number
}

export interface LcuChampSelectSessionPayload {
  gameId?: number
  localPlayerCellId?: number
  actions?: LcuChampSelectAction[][]
  myTeam?: LcuChampSelectTeamMember[]
  theirTeam?: LcuChampSelectTeamMember[]
  bans?: LcuChampSelectBans
  timer?: LcuChampSelectTimer
}

interface MapLcuChampSelectSessionToDraftStateInput extends DesktopChampSelectMapperContext {
  session: LcuChampSelectSessionPayload
}

const POSITION_TO_ROLE: Record<string, Role> = {
  top: 'TOP',
  jungle: 'JUNGLE',
  middle: 'MID',
  mid: 'MID',
  bottom: 'ADC',
  bot: 'ADC',
  adc: 'ADC',
  utility: 'SUPPORT',
  support: 'SUPPORT',
}

function normalizeAssignedRole(position?: string) {
  if (!position) {
    return undefined
  }

  return POSITION_TO_ROLE[position.trim().toLowerCase()]
}

function flattenActions(actions: LcuChampSelectSessionPayload['actions']) {
  return actions?.flat() ?? []
}

function createChampionResolver(championCatalog: DesktopChampSelectMapperContext['championCatalog']) {
  const championIdByRiotChampionId = new Map<number, string>()

  for (const champion of championCatalog) {
    championIdByRiotChampionId.set(champion.riotChampionId, champion.championId)
  }

  return (riotChampionId?: number) => {
    if (!riotChampionId || riotChampionId <= 0) {
      return undefined
    }

    return championIdByRiotChampionId.get(riotChampionId)
  }
}

function createLatestActionIndex(actions: LcuChampSelectAction[]) {
  const latestActions = new Map<string, LcuChampSelectAction>()

  for (const action of actions) {
    const key = `${action.type}:${action.actorCellId}`
    const current = latestActions.get(key)
    const actionRank = action.id ?? action.pickTurn ?? 0
    const currentRank = current ? current.id ?? current.pickTurn ?? 0 : -1

    if (!current || actionRank >= currentRank) {
      latestActions.set(key, action)
    }
  }

  return latestActions
}

function resolveRoleForTeamMember(member: LcuChampSelectTeamMember, memberIndex: number, claimedRoles: Set<Role>) {
  const normalizedAssignedRole = normalizeAssignedRole(member.assignedPosition)

  if (normalizedAssignedRole && !claimedRoles.has(normalizedAssignedRole)) {
    claimedRoles.add(normalizedAssignedRole)
    return normalizedAssignedRole
  }

  const preferredFallbackRole = ROLE_ORDER[memberIndex]

  if (preferredFallbackRole && !claimedRoles.has(preferredFallbackRole)) {
    claimedRoles.add(preferredFallbackRole)
    return preferredFallbackRole
  }

  const firstUnclaimedRole = ROLE_ORDER.find((role) => !claimedRoles.has(role)) ?? ROLE_ORDER[memberIndex] ?? 'TOP'
  claimedRoles.add(firstUnclaimedRole)
  return firstUnclaimedRole
}

function buildDraftPicks(
  team: LcuChampSelectTeamMember[],
  latestActions: Map<string, LcuChampSelectAction>,
  resolveChampionId: (riotChampionId?: number) => string | undefined,
) {
  const claimedRoles = new Set<Role>()
  const picks: Partial<Record<Role, { championId?: string; isLocked?: boolean }>> = {}

  team.forEach((member, memberIndex) => {
    const role = resolveRoleForTeamMember(member, memberIndex, claimedRoles)
    const latestPickAction = latestActions.get(`pick:${member.cellId}`)
    const resolvedChampionId =
      resolveChampionId(member.championId) ??
      resolveChampionId(latestPickAction?.championId) ??
      resolveChampionId(member.championPickIntent)

    picks[role] = {
      championId: resolvedChampionId,
      isLocked: Boolean(latestPickAction?.completed && resolvedChampionId),
    }
  })

  return picks
}

function buildTeamBans(
  team: LcuChampSelectTeamMember[],
  latestActions: Map<string, LcuChampSelectAction>,
  resolveChampionId: (riotChampionId?: number) => string | undefined,
  fallbackBanIds: number[] = [],
) {
  const actorCellIds = new Set(team.map((member) => member.cellId))
  const actionBanChampionIds = [...latestActions.values()]
    .filter((action) => action.type === 'ban' && action.completed && actorCellIds.has(action.actorCellId))
    .flatMap((action) => {
      const championId = resolveChampionId(action.championId)
      return championId ? [championId] : []
    })

  if (actionBanChampionIds.length > 0) {
    return [...new Set(actionBanChampionIds)]
  }

  return [...new Set(fallbackBanIds.map((riotChampionId) => resolveChampionId(riotChampionId)).filter(Boolean) as string[])]
}

function resolveCurrentPickRole(
  session: LcuChampSelectSessionPayload,
  myTeam: LcuChampSelectTeamMember[],
  latestActions: Map<string, LcuChampSelectAction>,
) {
  const claimedRoles = new Set<Role>()
  const roleByCellId = new Map<number, Role>()

  myTeam.forEach((member, memberIndex) => {
    roleByCellId.set(member.cellId, resolveRoleForTeamMember(member, memberIndex, claimedRoles))
  })

  const localPlayerRole = session.localPlayerCellId ? roleByCellId.get(session.localPlayerCellId) : undefined
  const localPlayerPickAction = session.localPlayerCellId
    ? latestActions.get(`pick:${session.localPlayerCellId}`)
    : undefined

  if (localPlayerPickAction && !localPlayerPickAction.completed && localPlayerRole) {
    return localPlayerRole
  }

  if (localPlayerRole) {
    return localPlayerRole
  }

  const firstOpenRole = ROLE_ORDER.find((role) => {
    const member = myTeam.find((teamMember) => roleByCellId.get(teamMember.cellId) === role)
    return !member?.championId
  })

  return firstOpenRole ?? 'TOP'
}

function buildAvailableChampionIds(
  championCatalog: DesktopChampSelectMapperContext['championCatalog'],
  usedChampionIds: string[],
) {
  const unavailableChampionIds = new Set(usedChampionIds)

  return championCatalog
    .map((champion) => champion.championId)
    .filter((championId) => !unavailableChampionIds.has(championId))
}

export function mapLcuChampSelectSessionToDraftState({
  session,
  patchVersion,
  championCatalog,
  productMode,
  recommendationMode,
}: MapLcuChampSelectSessionToDraftStateInput): DraftState {
  const myTeam = session.myTeam ?? []
  const theirTeam = session.theirTeam ?? []
  const latestActions = createLatestActionIndex(flattenActions(session.actions))
  const resolveChampionId = createChampionResolver(championCatalog)

  const allyPicks = buildDraftPicks(myTeam, latestActions, resolveChampionId)
  const enemyPicks = buildDraftPicks(theirTeam, latestActions, resolveChampionId)
  const allyBans = buildTeamBans(myTeam, latestActions, resolveChampionId, session.bans?.myTeamBans)
  const enemyBans = buildTeamBans(theirTeam, latestActions, resolveChampionId, session.bans?.theirTeamBans)
  const usedChampionIds = [
    ...Object.values(allyPicks).flatMap((slot) => (slot?.championId ? [slot.championId] : [])),
    ...Object.values(enemyPicks).flatMap((slot) => (slot?.championId ? [slot.championId] : [])),
    ...allyBans,
    ...enemyBans,
  ]

  return createDraftState({
    patchVersion,
    currentPickRole: resolveCurrentPickRole(session, myTeam, latestActions),
    productMode,
    recommendationMode,
    allyPicks,
    enemyPicks,
    allyBans,
    enemyBans,
    availableChampionIds: buildAvailableChampionIds(championCatalog, usedChampionIds),
  })
}
