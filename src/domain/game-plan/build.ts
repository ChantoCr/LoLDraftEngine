import type { Champion } from '@/domain/champion/types'
import type { CompositionProfile } from '@/domain/composition/types'
import { buildDraftContext } from '@/domain/draft-context/build'
import { getDraftSlot } from '@/domain/draft/selectors'
import type { DraftState } from '@/domain/draft/types'
import type { LiveGamePlan } from '@/domain/game-plan/types'

interface BuildLiveGamePlanInput {
  draftState: DraftState
  championsById: Record<string, Champion>
  allyProfile: CompositionProfile
  enemyProfile: CompositionProfile
}

function buildPlayerJob(playerChampion: Champion | undefined) {
  if (!playerChampion) {
    return 'Fill the open role with the champion that best stabilizes your current comp structure.'
  }

  const tasks: string[] = []

  if (playerChampion.traits.frontline >= 3 || playerChampion.traits.engage >= 3) {
    tasks.push('start or anchor fights on your team’s terms')
  }

  if (playerChampion.traits.peel >= 3 || playerChampion.traits.disengage >= 3) {
    tasks.push('protect your main carry through the first enemy access window')
  }

  if (playerChampion.traits.poke >= 3) {
    tasks.push('control space and soften targets before full commits')
  }

  if (playerChampion.traits.pick >= 3) {
    tasks.push('play around catches, vision denial, and punish isolated targets')
  }

  if (playerChampion.traits.scaling >= 3) {
    tasks.push('respect early volatility and buy time for stronger breakpoints')
  }

  if (tasks.length === 0) {
    tasks.push('play around your team’s strongest coordinated cooldown cycle')
  }

  return `${playerChampion.name} should ${tasks.slice(0, 2).join(' while ')}.`
}

function getEnemyThreatChampionName(enemyProfile: CompositionProfile, championsById: Record<string, Champion>) {
  const rankedThreats = enemyProfile.championIds
    .map((championId) => championsById[championId])
    .filter(Boolean)
    .map((champion) => ({
      champion,
      threatScore:
        champion.traits.dive +
        champion.traits.pick +
        champion.traits.engage +
        champion.traits.poke * 0.5,
    }))
    .sort((left, right) => right.threatScore - left.threatScore)

  return rankedThreats[0]?.champion.name
}

function buildPracticalRules(
  playerChampion: Champion | undefined,
  allyProfile: CompositionProfile,
  enemyProfile: CompositionProfile,
  keyThreatChampionName?: string,
  laneSummary?: string,
  midGameSummary?: string,
  objectiveSummary?: string,
) {
  const rules: string[] = []

  if (laneSummary) {
    rules.push(laneSummary)
  }

  if (allyProfile.winConditions[0]) {
    rules.push(allyProfile.winConditions[0])
  }

  if (keyThreatChampionName) {
    rules.push(`Track ${keyThreatChampionName} before committing major cooldowns or objective fights.`)
  }

  if (enemyProfile.archetypes.includes('POKE') && allyProfile.averageTraits.engage >= 2) {
    rules.push('Do not give the enemy repeated poke resets; commit once their ranged setup oversteps.')
  }

  if (enemyProfile.archetypes.includes('DIVE') || enemyProfile.archetypes.includes('PICK')) {
    rules.push('Respect fog-of-war angles and keep your carry line covered before neutral fights start.')
  }

  if (playerChampion?.traits.scaling && playerChampion.traits.scaling >= 3) {
    rules.push('Avoid unnecessary early flips if your comp improves significantly with time or item spikes.')
  }

  if (objectiveSummary) {
    rules.push(objectiveSummary)
  }

  if (midGameSummary) {
    rules.push(midGameSummary)
  }

  if (rules.length < 4 && allyProfile.structuralGaps[0]) {
    rules.push(`Play around the fact that your comp is still light on ${allyProfile.structuralGaps[0].toLowerCase()}.`)
  }

  return rules.slice(0, 4)
}

export function buildLiveGamePlan({
  draftState,
  championsById,
  allyProfile,
  enemyProfile,
}: BuildLiveGamePlanInput): LiveGamePlan {
  const playerRole = draftState.currentPickRole
  const playerChampionId = getDraftSlot(draftState.allyTeam, playerRole)?.championId
  const playerChampion = playerChampionId ? championsById[playerChampionId] : undefined
  const keyThreatChampionName = getEnemyThreatChampionName(enemyProfile, championsById)
  const draftContext = buildDraftContext({
    draftState,
    championsById,
    allyProfile,
    enemyProfile,
  })

  return {
    playerRole,
    playerChampionId,
    playerChampionName: playerChampion?.name,
    playerJob: buildPlayerJob(playerChampion),
    allyIdentity: allyProfile.archetypes,
    enemyIdentity: enemyProfile.archetypes,
    keyThreat: keyThreatChampionName
      ? `${keyThreatChampionName} is the clearest enemy threat to track in fights.`
      : 'No single enemy threat stands out yet; respect the overall comp structure instead.',
    easiestWinCondition:
      allyProfile.winConditions[0] ?? 'Play toward your cleanest coordinated fight pattern and strongest objective setup.',
    practicalRules: buildPracticalRules(
      playerChampion,
      allyProfile,
      enemyProfile,
      keyThreatChampionName,
      draftContext.lanePhaseByRole[playerRole]?.summary,
      draftContext.midGame.summary,
      draftContext.objectives.summary,
    ),
    executionDifficulty: allyProfile.executionDifficulty,
    lanePhase: draftContext.lanePhaseByRole[playerRole],
    midGame: draftContext.midGame,
    objectives: draftContext.objectives,
    matchupDangers: draftContext.matchupDangers.slice(0, 3),
  }
}
