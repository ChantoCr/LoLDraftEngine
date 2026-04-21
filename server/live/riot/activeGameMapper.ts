import type { ChampionClass, Role } from '@/domain/champion/types'
import { ROLE_ORDER } from '@/domain/draft/constants'
import { createDraftState } from '@/domain/draft/factories'
import type { DraftState } from '@/domain/draft/types'
import type { DesktopChampionCatalogEntry } from '@server/live/desktopClient/source'
import type { RiotRecognizedPlayer } from '@server/live/riot/client'

interface MapRiotActiveGameToDraftStateInput {
  player: RiotRecognizedPlayer
  championCatalog: DesktopChampionCatalogEntry[]
  patchVersion: string
}

export interface RiotActiveGameMapResult {
  draftState?: DraftState
  participantCount: number
  mappedChampionCount: number
  failureReason?: string
}

type RiotActiveGameParticipant = NonNullable<RiotRecognizedPlayer['activeGame']>['participants'][number]

interface ParticipantRoleAssignment {
  participant: RiotActiveGameParticipant
  role: Role
  championId?: string
}

const SMITE_SPELL_ID = 11
const TELEPORT_SPELL_ID = 12
const HEAL_SPELL_ID = 7
const BARRIER_SPELL_ID = 21
const EXHAUST_SPELL_ID = 3

function createChampionResolver(championCatalog: DesktopChampionCatalogEntry[]) {
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

function createChampionMetadataResolver(championCatalog: DesktopChampionCatalogEntry[]) {
  const championByRiotChampionId = new Map<number, DesktopChampionCatalogEntry>()

  for (const champion of championCatalog) {
    championByRiotChampionId.set(champion.riotChampionId, champion)
  }

  return (riotChampionId?: number) => {
    if (!riotChampionId || riotChampionId <= 0) {
      return undefined
    }

    return championByRiotChampionId.get(riotChampionId)
  }
}

function isLocalParticipant(participant: RiotActiveGameParticipant, player: RiotRecognizedPlayer) {
  return (
    participant.puuid === player.account.puuid ||
    (participant.riotIdGameName === player.account.gameName && participant.riotIdTagline === player.account.tagLine) ||
    participant.summonerName === player.account.gameName
  )
}

function resolveLocalTeamId(player: RiotRecognizedPlayer) {
  const participants = player.activeGame?.participants ?? []
  const localParticipant = participants.find((participant) => isLocalParticipant(participant, player))

  return localParticipant?.teamId ?? participants[0]?.teamId ?? 100
}

function createEmptyRoleScores(index: number) {
  return ROLE_ORDER.reduce<Record<Role, number>>((accumulator, role) => {
    accumulator[role] = ROLE_ORDER[index] === role ? 0.15 : 0
    return accumulator
  }, {} as Record<Role, number>)
}

function addRecommendedRoleScores(scores: Record<Role, number>, recommendedRoles: Role[] = []) {
  const weights = [18, 12, 7]

  recommendedRoles.forEach((role, index) => {
    scores[role] += weights[index] ?? 4
  })
}

function addClassRoleScores(scores: Record<Role, number>, classes: ChampionClass[] = []) {
  for (const championClass of classes) {
    switch (championClass) {
      case 'MARKSMAN':
        scores.ADC += 12
        scores.MID += 2
        break
      case 'ENCHANTER':
        scores.SUPPORT += 12
        scores.MID += 1
        break
      case 'CATCHER':
        scores.SUPPORT += 10
        scores.MID += 1
        break
      case 'MAGE':
        scores.MID += 10
        scores.SUPPORT += 2
        break
      case 'ASSASSIN':
        scores.MID += 10
        scores.JUNGLE += 4
        scores.TOP += 1
        break
      case 'FIGHTER':
        scores.TOP += 8
        scores.JUNGLE += 7
        scores.MID += 2
        break
      case 'TANK':
        scores.TOP += 8
        scores.JUNGLE += 7
        scores.SUPPORT += 4
        break
    }
  }
}

function participantHasSpell(participant: RiotActiveGameParticipant, spellId: number) {
  return participant.spell1Id === spellId || participant.spell2Id === spellId
}

function addSummonerSpellRoleScores(scores: Record<Role, number>, participant: RiotActiveGameParticipant) {
  if (participantHasSpell(participant, SMITE_SPELL_ID)) {
    scores.JUNGLE += 40
    scores.TOP -= 6
    scores.MID -= 6
    scores.ADC -= 8
    scores.SUPPORT -= 8
  }

  if (participantHasSpell(participant, TELEPORT_SPELL_ID)) {
    scores.TOP += 3
    scores.MID += 2
  }

  if (participantHasSpell(participant, HEAL_SPELL_ID) || participantHasSpell(participant, BARRIER_SPELL_ID)) {
    scores.ADC += 3
  }

  if (participantHasSpell(participant, EXHAUST_SPELL_ID)) {
    scores.SUPPORT += 2
  }
}

function createRolePreferenceScores(
  participant: RiotActiveGameParticipant,
  championMetadata: DesktopChampionCatalogEntry | undefined,
  index: number,
) {
  const scores = createEmptyRoleScores(index)

  addRecommendedRoleScores(scores, championMetadata?.recommendedRoles)
  addClassRoleScores(scores, championMetadata?.classes)
  addSummonerSpellRoleScores(scores, participant)

  return scores
}

function assignRolesToParticipants(
  participants: RiotActiveGameParticipant[],
  resolveChampionId: (riotChampionId?: number) => string | undefined,
  resolveChampionMetadata: (riotChampionId?: number) => DesktopChampionCatalogEntry | undefined,
) {
  const enrichedParticipants = participants.slice(0, ROLE_ORDER.length).map((participant, index) => ({
    participant,
    index,
    championId: resolveChampionId(participant.championId),
    scores: createRolePreferenceScores(participant, resolveChampionMetadata(participant.championId), index),
  }))

  let bestAssignments: ParticipantRoleAssignment[] = []
  let bestScore = Number.NEGATIVE_INFINITY

  function search(nextIndex: number, availableRoles: Role[], currentAssignments: ParticipantRoleAssignment[], currentScore: number) {
    if (nextIndex >= enrichedParticipants.length) {
      if (currentScore > bestScore) {
        bestScore = currentScore
        bestAssignments = currentAssignments
      }
      return
    }

    const currentParticipant = enrichedParticipants[nextIndex]

    for (const role of availableRoles) {
      search(
        nextIndex + 1,
        availableRoles.filter((candidateRole) => candidateRole !== role),
        [
          ...currentAssignments,
          {
            participant: currentParticipant.participant,
            role,
            championId: currentParticipant.championId,
          },
        ],
        currentScore + currentParticipant.scores[role],
      )
    }
  }

  search(0, [...ROLE_ORDER], [], 0)
  return bestAssignments
}

function buildTeamPicks(
  participants: RiotActiveGameParticipant[],
  resolveChampionId: (riotChampionId?: number) => string | undefined,
  resolveChampionMetadata: (riotChampionId?: number) => DesktopChampionCatalogEntry | undefined,
) {
  const assignments = assignRolesToParticipants(participants, resolveChampionId, resolveChampionMetadata)
  let mappedChampionCount = 0

  const picks = assignments.reduce<Partial<Record<Role, { championId?: string; isLocked: boolean }>>>((accumulator, assignment) => {
    if (assignment.championId) {
      mappedChampionCount += 1
    }

    accumulator[assignment.role] = {
      championId: assignment.championId,
      isLocked: Boolean(assignment.championId),
    }

    return accumulator
  }, {})

  return {
    picks,
    assignments,
    mappedChampionCount,
  }
}

function buildTeamBans(
  bannedChampions: NonNullable<RiotRecognizedPlayer['activeGame']>['bannedChampions'] | undefined,
  teamId: number,
  resolveChampionId: (riotChampionId?: number) => string | undefined,
) {
  return (bannedChampions ?? []).flatMap((ban) => {
    if (ban.teamId !== teamId) {
      return []
    }

    const championId = resolveChampionId(ban.championId)
    return championId ? [championId] : []
  })
}

export function mapRiotActiveGameToDraftStateWithDebug({
  player,
  championCatalog,
  patchVersion,
}: MapRiotActiveGameToDraftStateInput): RiotActiveGameMapResult {
  const activeGame = player.activeGame

  if (!activeGame || !activeGame.participants || activeGame.participants.length === 0) {
    return {
      participantCount: 0,
      mappedChampionCount: 0,
      failureReason: 'No Riot spectator participant roster was available to map into the draft board.',
    }
  }

  const resolveChampionId = createChampionResolver(championCatalog)
  const resolveChampionMetadata = createChampionMetadataResolver(championCatalog)
  const localTeamId = resolveLocalTeamId(player)
  const allyParticipants = activeGame.participants.filter((participant) => participant.teamId === localTeamId)
  const enemyParticipants = activeGame.participants.filter((participant) => participant.teamId !== localTeamId)

  if (allyParticipants.length === 0 || enemyParticipants.length === 0) {
    return {
      participantCount: activeGame.participants.length,
      mappedChampionCount: 0,
      failureReason: 'Riot spectator data did not include both ally and enemy team rosters for draft-board mapping.',
    }
  }

  const allyTeamMapping = buildTeamPicks(allyParticipants, resolveChampionId, resolveChampionMetadata)
  const enemyTeamMapping = buildTeamPicks(enemyParticipants, resolveChampionId, resolveChampionMetadata)
  const allyBans = buildTeamBans(activeGame.bannedChampions ?? [], localTeamId, resolveChampionId)
  const enemyTeamId = enemyParticipants[0]?.teamId ?? (localTeamId === 100 ? 200 : 100)
  const enemyBans = buildTeamBans(activeGame.bannedChampions ?? [], enemyTeamId, resolveChampionId)
  const localParticipantRole =
    allyTeamMapping.assignments.find((assignment) => isLocalParticipant(assignment.participant, player))?.role ?? 'TOP'
  const usedChampionIds = [
    ...Object.values(allyTeamMapping.picks).flatMap((slot) => (slot?.championId ? [slot.championId] : [])),
    ...Object.values(enemyTeamMapping.picks).flatMap((slot) => (slot?.championId ? [slot.championId] : [])),
    ...allyBans,
    ...enemyBans,
  ]
  const mappedChampionCount = allyTeamMapping.mappedChampionCount + enemyTeamMapping.mappedChampionCount

  if (mappedChampionCount === 0) {
    return {
      participantCount: activeGame.participants.length,
      mappedChampionCount,
      failureReason: 'Riot spectator participants were found, but none of their champion ids resolved against the current champion catalog.',
    }
  }

  return {
    participantCount: activeGame.participants.length,
    mappedChampionCount,
    draftState: createDraftState({
      patchVersion,
      currentPickRole: localParticipantRole,
      allyPicks: allyTeamMapping.picks,
      enemyPicks: enemyTeamMapping.picks,
      allyBans,
      enemyBans,
      availableChampionIds: championCatalog
        .map((champion) => champion.championId)
        .filter((championId) => !usedChampionIds.includes(championId)),
    }),
  }
}

export function mapRiotActiveGameToDraftState(input: MapRiotActiveGameToDraftStateInput): DraftState | undefined {
  return mapRiotActiveGameToDraftStateWithDebug(input).draftState
}
