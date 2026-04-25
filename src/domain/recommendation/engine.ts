import type { ChampionPoolEntry, ChampionPoolProfile, ChampionPoolTier } from '@/domain/champion-pool/types'
import type { Champion } from '@/domain/champion/types'
import { average, clamp, roundTo, sum, unique } from '@/domain/common/math'
import { analyzeDraftComposition } from '@/domain/composition/analyzer'
import type { CompositionProfile } from '@/domain/composition/types'
import { buildDraftContext } from '@/domain/draft-context/build'
import { assignChampionToSlot } from '@/domain/draft/operations'
import { countFilledSlots, getPickedChampionIds, isChampionAvailable } from '@/domain/draft/selectors'
import type { DraftState, RecommendationMode } from '@/domain/draft/types'
import { RECOMMENDATION_WEIGHTS_BY_MODE, type RecommendationWeights } from '@/domain/recommendation/config'
import type {
  RecommendationCandidate,
  RecommendationDimension,
  RecommendationDimensionScore,
  RecommendationNarrative,
  RecommendationReason,
  RecommendationScenario,
} from '@/domain/recommendation/types'
import { getChampionMetaSignal, getMatchupSignal, getSynergySignal } from '@/domain/stats/selectors'
import type { MetaSignal, PatchDataBundle, SynergySignal } from '@/domain/stats/types'

interface RecommendChampionsForDraftInput {
  draftState: DraftState
  championsById: Record<string, Champion>
  recommendationMode?: RecommendationMode
  championPool?: ChampionPoolProfile
  statsBundle?: PatchDataBundle
  topN?: number
}

interface RecommendationNeeds {
  needFrontline: number
  needEngage: number
  needPeel: number
  needDamageBalance: number
}

interface RecommendationContext {
  draftState: DraftState
  championsById: Record<string, Champion>
  recommendationMode: RecommendationMode
  allyProfile: CompositionProfile
  enemyProfile: CompositionProfile
  championPool?: ChampionPoolProfile
  poolEntriesByChampionId: Record<string, ChampionPoolEntry>
  weights: RecommendationWeights
  needs: RecommendationNeeds
  statsBundle?: PatchDataBundle
}


function getPoolEntriesByChampionId(championPool?: ChampionPoolProfile) {
  return (championPool?.entries ?? []).reduce<Record<string, ChampionPoolEntry>>((entriesByChampionId, entry) => {
    entriesByChampionId[entry.championId] = entry
    return entriesByChampionId
  }, {})
}

function getTierBaseScore(tier: ChampionPoolTier) {
  switch (tier) {
    case 'MAIN':
      return 9.5
    case 'COMFORT':
      return 8.2
    case 'PLAYABLE':
      return 6.7
    case 'EMERGENCY':
      return 5.3
    default:
      return 5
  }
}

function getWeightsForMode(productMode: DraftState['productMode'], recommendationMode: RecommendationMode) {
  const weights = { ...RECOMMENDATION_WEIGHTS_BY_MODE[productMode] }
  weights.comfortFit = recommendationMode === 'PERSONAL_POOL' ? 1.15 : 0
  return weights
}

function createNeeds(allyProfile: CompositionProfile, enemyProfile: CompositionProfile): RecommendationNeeds {
  const enemyDivePressure = enemyProfile.averageTraits.dive * 0.55 + enemyProfile.averageTraits.pick * 0.45
  const peelCoverage = allyProfile.averageTraits.peel * 0.7 + allyProfile.averageTraits.disengage * 0.3

  return {
    needFrontline: clamp((2.4 - allyProfile.averageTraits.frontline) / 2.4, 0, 1),
    needEngage: clamp((2.5 - allyProfile.averageTraits.engage) / 2.5, 0, 1),
    needPeel: clamp((enemyDivePressure + 0.2 - peelCoverage) / 2.2, 0, 1),
    needDamageBalance: allyProfile.damageProfile.leaning === 'BALANCED' ? 0 : 1,
  }
}

function scaleTraitScore(value: number, multiplier = 1) {
  return clamp(roundTo(value * 2 * multiplier, 1), 0, 10)
}

export function buildRecommendationScenarioForChampion(
  candidate: Champion,
  input: { draftState: DraftState; championsById: Record<string, Champion> },
): RecommendationScenario {
  const simulatedDraftState = assignChampionToSlot(
    input.draftState,
    'ALLY',
    input.draftState.currentPickRole,
    candidate.id,
    true,
  )
  const allyProfile = analyzeDraftComposition({
    draftState: simulatedDraftState,
    championsById: input.championsById,
    side: 'ALLY',
  })
  const enemyProfile = analyzeDraftComposition({
    draftState: simulatedDraftState,
    championsById: input.championsById,
    side: 'ENEMY',
  })

  return {
    simulatedDraftState,
    allyProfile,
    enemyProfile,
    draftContext: buildDraftContext({
      draftState: simulatedDraftState,
      championsById: input.championsById,
      allyProfile,
      enemyProfile,
    }),
  }
}

function getCandidateChampions({
  draftState,
  championsById,
  recommendationMode,
  championPool,
}: RecommendChampionsForDraftInput) {
  const availableChampions = draftState.availableChampionIds.flatMap((championId) => {
    const champion = championsById[championId]
    if (!champion || !champion.roles.includes(draftState.currentPickRole)) {
      return []
    }

    return isChampionAvailable(draftState, championId) ? [champion] : []
  })

  if (recommendationMode !== 'PERSONAL_POOL') {
    return availableChampions
  }

  if (!championPool || championPool.role !== draftState.currentPickRole) {
    return []
  }

  const poolChampionIds = new Set(championPool.entries.map((entry) => entry.championId))
  return availableChampions.filter((champion) => poolChampionIds.has(champion.id))
}

function blendStatScore(baseScore: number, statScore: number | undefined, confidenceScore: number, maxImpact = 0.2) {
  if (statScore === undefined) {
    return baseScore
  }

  const impact = clamp(confidenceScore * maxImpact, 0, maxImpact)
  return clamp(roundTo(baseScore * (1 - impact) + statScore * impact, 1), 0, 10)
}

function mapDeltaWinRateToScore(deltaWinRate = 0, lanePressure = 0) {
  return clamp(roundTo(5 + deltaWinRate * 100 * 1.5 + lanePressure * 3, 1), 0, 10)
}

function mapMetaSignalToScore(metaSignal: MetaSignal) {
  const tierBase: Record<NonNullable<MetaSignal['tier']>, number> = {
    S: 9.5,
    A: 8.4,
    B: 7.1,
    C: 5.8,
    D: 4.4,
  }
  const baseScore = metaSignal.tier ? tierBase[metaSignal.tier] : 6.4
  const winRateAdjustment = ((metaSignal.winRate ?? 0.5) - 0.5) * 100 * 1.4
  const presenceAdjustment = (metaSignal.pickRate ?? 0) * 8 + (metaSignal.banRate ?? 0) * 4

  return clamp(roundTo(baseScore + winRateAdjustment + presenceAdjustment, 1), 0, 10)
}

function resolveSynergySignal(
  statsBundle: PatchDataBundle,
  candidateChampionId: string,
  allyChampionId: string,
): SynergySignal | undefined {
  return (
    getSynergySignal(statsBundle, candidateChampionId, allyChampionId) ??
    getSynergySignal(statsBundle, allyChampionId, candidateChampionId)
  )
}

function getAllyPickedChampionIds(draftState: DraftState) {
  return getPickedChampionIds(draftState, 'ALLY')
}

function getEnemyPickedChampionIds(draftState: DraftState) {
  return getPickedChampionIds(draftState, 'ENEMY')
}

function getCandidateSynergySignals(candidate: Champion, context: RecommendationContext) {
  if (!context.statsBundle) {
    return []
  }

  return getAllyPickedChampionIds(context.draftState)
    .filter((championId) => championId !== candidate.id)
    .flatMap((allyChampionId) => {
      const signal = resolveSynergySignal(context.statsBundle!, candidate.id, allyChampionId)
      return signal ? [signal] : []
    })
}

function getCandidateMatchupSignals(candidate: Champion, context: RecommendationContext) {
  if (!context.statsBundle) {
    return []
  }

  return getEnemyPickedChampionIds(context.draftState).flatMap((enemyChampionId) => {
    const signal = getMatchupSignal(
      context.statsBundle!,
      candidate.id,
      context.draftState.currentPickRole,
      enemyChampionId,
    )

    return signal ? [signal] : []
  })
}

function scoreAllySynergy(candidate: Champion, allyProfile: CompositionProfile, context: RecommendationContext) {
  const rawScore =
    candidate.traits.engage * (allyProfile.averageTraits.engage * 0.5 + allyProfile.averageTraits.scaling * 0.35) +
    candidate.traits.peel * (allyProfile.averageTraits.scaling * 0.55 + allyProfile.averageTraits.frontline * 0.15) +
    candidate.traits.frontline * (allyProfile.averageTraits.scaling * 0.35 + allyProfile.averageTraits.peel * 0.15) +
    candidate.traits.pick * allyProfile.averageTraits.engage * 0.2
  const baseScore = clamp(roundTo(rawScore / 2.7, 1), 0, 10)
  const synergySignals = getCandidateSynergySignals(candidate, context)

  if (synergySignals.length === 0) {
    return baseScore
  }

  const weightedScores = synergySignals.map((signal) => signal.synergyScore * signal.confidence.score)
  const totalConfidence = average(synergySignals.map((signal) => signal.confidence.score))

  return blendStatScore(baseScore, average(weightedScores), totalConfidence, 0.22)
}

function scoreEnemyCounter(candidate: Champion, enemyProfile: CompositionProfile, context: RecommendationContext) {
  const antiDive =
    (candidate.traits.peel * 0.7 + candidate.traits.disengage * 0.3) *
    (enemyProfile.averageTraits.dive * 0.55 + enemyProfile.averageTraits.pick * 0.45)
  const antiPoke = candidate.traits.engage * enemyProfile.averageTraits.poke * 0.3
  const antiPick = candidate.traits.frontline * enemyProfile.averageTraits.pick * 0.25
  const baseScore = clamp(roundTo((antiDive + antiPoke + antiPick) / 1.2, 1), 0, 10)
  const matchupSignals = getCandidateMatchupSignals(candidate, context)

  if (matchupSignals.length === 0) {
    return baseScore
  }

  const statScore = average(
    matchupSignals.map((signal) => mapDeltaWinRateToScore(signal.deltaWinRate, signal.lanePressure) * signal.confidence.score),
  )
  const totalConfidence = average(matchupSignals.map((signal) => signal.confidence.score))

  return blendStatScore(baseScore, statScore, totalConfidence, 0.24)
}

function scoreCompRepair(candidate: Champion, allyProfile: CompositionProfile, needs: RecommendationNeeds) {
  const damageRepair =
    needs.needDamageBalance === 0
      ? 0.4
      : candidate.traits.damageProfile === 'MAGIC'
        ? 1.1
        : candidate.traits.damageProfile === 'MIXED'
          ? 0.9
          : 0.2

  const rawScore =
    candidate.traits.frontline * needs.needFrontline +
    candidate.traits.engage * needs.needEngage +
    (candidate.traits.peel * 0.7 + candidate.traits.disengage * 0.3) * needs.needPeel +
    damageRepair

  const hybridTax = allyProfile.archetypes.includes('HYBRID') ? 0.4 : 0

  return clamp(roundTo(rawScore * 2 - hybridTax, 1), 0, 10)
}

function scoreDamageBalance(candidate: Champion, allyProfile: CompositionProfile) {
  if (allyProfile.damageProfile.leaning === 'BALANCED') {
    return candidate.traits.damageProfile === 'PHYSICAL' ? 5.5 : 6.5
  }

  if (allyProfile.damageProfile.leaning === 'AD_HEAVY') {
    if (candidate.traits.damageProfile === 'MAGIC') {
      return 9
    }

    return candidate.traits.damageProfile === 'MIXED' ? 8 : 4
  }

  if (candidate.traits.damageProfile === 'PHYSICAL') {
    return 9
  }

  return candidate.traits.damageProfile === 'MIXED' ? 8 : 4
}

function scoreExecutionFit(candidate: Champion, context: RecommendationContext) {
  const aggression = candidate.traits.engage * 0.55 + candidate.traits.dive * 0.45
  const stability =
    candidate.traits.frontline * 0.5 + candidate.traits.peel * 0.7 + candidate.traits.disengage * 0.35
  const compBurden =
    context.allyProfile.executionDifficulty === 'HIGH'
      ? 1.4
      : context.allyProfile.executionDifficulty === 'MEDIUM'
        ? 0.8
        : 0.2

  if (context.draftState.productMode === 'COMPETITIVE') {
    return clamp(roundTo(5.8 + aggression * 0.65 + stability * 0.2 - compBurden, 1), 0, 10)
  }

  if (context.draftState.productMode === 'CLASH') {
    return clamp(roundTo(7 + stability * 0.45 + aggression * 0.15 - compBurden * 0.8, 1), 0, 10)
  }

  return clamp(roundTo(8.8 + stability * 0.35 - aggression * 0.25 - compBurden, 1), 0, 10)
}

function scoreMetaValue(candidate: Champion, context: RecommendationContext) {
  const activeTraits = [
    candidate.traits.engage,
    candidate.traits.disengage,
    candidate.traits.peel,
    candidate.traits.poke,
    candidate.traits.scaling,
    candidate.traits.dive,
    candidate.traits.pick,
    candidate.traits.frontline,
  ].filter((value) => value >= 2).length
  const topTraitAverage =
    [...Object.values(candidate.traits)]
      .filter((value): value is number => typeof value === 'number')
      .sort((left, right) => right - left)
      .slice(0, 3)
      .reduce((total, value) => total + value, 0) / 3
  const baseScore = clamp(roundTo(activeTraits * 0.7 + topTraitAverage * 1.4, 1), 0, 10)

  if (!context.statsBundle) {
    return baseScore
  }

  const metaSignal = getChampionMetaSignal(context.statsBundle, candidate.id, context.draftState.currentPickRole)

  if (!metaSignal) {
    return baseScore
  }

  return blendStatScore(baseScore, mapMetaSignalToScore(metaSignal), metaSignal.confidence.score, 0.28)
}

function scoreComfortFit(candidate: Champion, context: RecommendationContext) {
  const poolEntry = context.poolEntriesByChampionId[candidate.id]

  if (!poolEntry) {
    return context.recommendationMode === 'PERSONAL_POOL' ? 0 : 5
  }

  const baseScore = getTierBaseScore(poolEntry.tier)
  return clamp(roundTo(baseScore * 0.75 + poolEntry.masteryConfidence * 10 * 0.25, 1), 0, 10)
}

function scoreLaneMatchupFit(candidate: Champion, scenario: RecommendationScenario, context: RecommendationContext) {
  const laneGuidance = scenario.draftContext.lanePhaseByRole[context.draftState.currentPickRole]
  const primaryDanger = scenario.draftContext.matchupDangers.find((danger) => danger.role === context.draftState.currentPickRole)
  let score = 5.8

  if (laneGuidance) {
    switch (laneGuidance.posture) {
      case 'PRESS_PRIORITY':
        score += candidate.traits.poke * 0.45 + candidate.traits.pick * 0.15
        break
      case 'ALL_IN_WINDOW':
        score += candidate.traits.engage * 0.45 + candidate.traits.dive * 0.35
        break
      case 'PLAY_FOR_ROAM':
        score += candidate.traits.pick * 0.45 + candidate.traits.engage * 0.25
        break
      case 'PROTECT_WAVE':
        score += candidate.traits.poke * 0.25 + candidate.traits.disengage * 0.25
        break
      case 'SHORT_TRADE':
        score += candidate.traits.poke * 0.3 + candidate.traits.disengage * 0.3
        break
      case 'STABILIZE':
      default:
        score += candidate.traits.peel * 0.25 + candidate.traits.disengage * 0.35 + candidate.traits.frontline * 0.2
        break
    }
  }

  if (primaryDanger) {
    switch (primaryDanger.type) {
      case 'ALL_IN':
        score += candidate.traits.disengage * 0.45 + candidate.traits.peel * 0.35 + candidate.traits.frontline * 0.2
        break
      case 'POKE':
        score += candidate.traits.engage * 0.35 + candidate.traits.disengage * 0.25 + candidate.traits.poke * 0.2
        break
      case 'ROAM':
        score += candidate.traits.pick * 0.35 + candidate.traits.engage * 0.25 + candidate.traits.scaling * 0.1
        break
      case 'DIVE':
        score += candidate.traits.peel * 0.45 + candidate.traits.disengage * 0.35 + candidate.traits.frontline * 0.2
        break
      case 'PICK':
        score += candidate.traits.disengage * 0.4 + candidate.traits.peel * 0.25 + candidate.traits.frontline * 0.2
        break
      case 'PRIORITY_LOSS':
        score += candidate.traits.poke * 0.35 + candidate.traits.engage * 0.25 + candidate.traits.pick * 0.2
        break
    }

    if (primaryDanger.severity === 'HIGH') {
      score -= 0.2
    }
  }

  return clamp(roundTo(score, 1), 0, 10)
}

function scoreObjectiveSetupFit(candidate: Champion, scenario: RecommendationScenario, context: RecommendationContext) {
  const primaryCall = scenario.draftContext.objectives.primaryCall
  let score = 5.7

  switch (primaryCall) {
    case 'ARRIVE_FIRST':
      score += candidate.traits.engage * 0.25 + candidate.traits.pick * 0.25 + candidate.traits.poke * 0.15
      break
    case 'START_ON_SPAWN':
      score += candidate.traits.frontline * 0.35 + candidate.traits.engage * 0.3 + candidate.traits.peel * 0.15
      break
    case 'TURN_ON_ENTRY':
      score += candidate.traits.engage * 0.35 + candidate.traits.pick * 0.3 + candidate.traits.frontline * 0.2
      break
    case 'CONTROL_CHOKES':
      score += candidate.traits.poke * 0.35 + candidate.traits.pick * 0.3 + candidate.traits.disengage * 0.15
      break
    case 'TRADE_CROSSMAP':
      score += candidate.traits.scaling * 0.35 + candidate.traits.pick * 0.2 + candidate.traits.poke * 0.15
      break
    case 'AVOID_BLIND_ENTRY':
      score += candidate.traits.peel * 0.35 + candidate.traits.disengage * 0.3 + candidate.traits.frontline * 0.2
      break
  }

  if (context.draftState.productMode !== 'SOLO_QUEUE') {
    score += candidate.traits.engage * 0.05 + candidate.traits.peel * 0.05
  }

  return clamp(roundTo(score, 1), 0, 10)
}

function scoreMacroPostureFit(candidate: Champion, scenario: RecommendationScenario) {
  const posture = scenario.draftContext.midGame.posture
  let score = 5.8

  switch (posture) {
    case 'GROUP_AND_FORCE':
      score += candidate.traits.engage * 0.35 + candidate.traits.frontline * 0.3 + candidate.traits.dive * 0.15
      break
    case 'PROTECT_AND_FRONT_TO_BACK':
      score += candidate.traits.peel * 0.35 + candidate.traits.frontline * 0.3 + candidate.traits.scaling * 0.2
      break
    case 'PICK_AND_RESET':
      score += candidate.traits.pick * 0.4 + candidate.traits.poke * 0.2 + candidate.traits.engage * 0.15
      break
    case 'STALL_AND_SCALE':
      score += candidate.traits.scaling * 0.35 + candidate.traits.disengage * 0.25 + candidate.traits.peel * 0.2
      break
    case 'SIDE_AND_COLLAPSE':
      score += candidate.traits.dive * 0.35 + candidate.traits.pick * 0.25 + candidate.traits.engage * 0.2
      break
  }

  return clamp(roundTo(score, 1), 0, 10)
}

function buildDimensionScores(
  candidate: Champion,
  context: RecommendationContext,
  scenario: RecommendationScenario,
): RecommendationDimensionScore[] {
  const dimensions: Record<RecommendationDimension, number> = {
    allySynergy: scoreAllySynergy(candidate, scenario.allyProfile, context),
    enemyCounter: scoreEnemyCounter(candidate, scenario.enemyProfile, context),
    compRepair: scoreCompRepair(candidate, context.allyProfile, context.needs),
    damageBalance: scoreDamageBalance(candidate, scenario.allyProfile),
    frontlineImpact: scaleTraitScore(candidate.traits.frontline, 0.8 + context.needs.needFrontline * 0.8),
    engageImpact: scaleTraitScore(candidate.traits.engage, 0.75 + context.needs.needEngage * 0.7),
    peelImpact: scaleTraitScore(
      candidate.traits.peel * 0.7 + candidate.traits.disengage * 0.3,
      0.8 + context.needs.needPeel * 0.8,
    ),
    executionFit: scoreExecutionFit(candidate, context),
    metaValue: scoreMetaValue(candidate, context),
    comfortFit: scoreComfortFit(candidate, context),
    laneMatchupFit: scoreLaneMatchupFit(candidate, scenario, context),
    objectiveSetupFit: scoreObjectiveSetupFit(candidate, scenario, context),
    macroPostureFit: scoreMacroPostureFit(candidate, scenario),
  }

  return Object.entries(dimensions).map(([dimension, score]) => {
    const typedDimension = dimension as RecommendationDimension
    const weight = context.weights[typedDimension]

    return {
      dimension: typedDimension,
      score,
      weight,
      contribution: roundTo(score * weight, 1),
    }
  })
}

function getDimensionScore(
  dimensions: RecommendationDimensionScore[],
  dimension: RecommendationDimension,
): RecommendationDimensionScore {
  const score = dimensions.find((entry) => entry.dimension === dimension)

  if (!score) {
    throw new Error(`Missing score for dimension: ${dimension}`)
  }

  return score
}

function getStrongestSynergySignal(candidate: Champion, context: RecommendationContext) {
  return getCandidateSynergySignals(candidate, context).sort(
    (left, right) => right.synergyScore * right.confidence.score - left.synergyScore * left.confidence.score,
  )[0]
}

function getStrongestMatchupSignal(candidate: Champion, context: RecommendationContext) {
  return getCandidateMatchupSignals(candidate, context).sort(
    (left, right) =>
      mapDeltaWinRateToScore(right.deltaWinRate, right.lanePressure) * right.confidence.score -
      mapDeltaWinRateToScore(left.deltaWinRate, left.lanePressure) * left.confidence.score,
  )[0]
}

function buildMetaReason(candidate: Champion, context: RecommendationContext): RecommendationReason | undefined {
  if (!context.statsBundle) {
    return undefined
  }

  const metaSignal = getChampionMetaSignal(context.statsBundle, candidate.id, context.draftState.currentPickRole)

  if (!metaSignal || metaSignal.confidence.level === 'low') {
    return undefined
  }

  if (metaSignal.tier !== 'S' && metaSignal.tier !== 'A') {
    return undefined
  }

  return {
    id: `${candidate.id}-meta-signal`,
    type: 'META',
    direction: 'pro',
    label: 'Patch data supports this candidate',
    explanation: `${candidate.name} shows strong ${context.draftState.currentPickRole.toLowerCase()} meta signals on patch ${metaSignal.patchVersion}.`,
    impact: roundTo(mapMetaSignalToScore(metaSignal) * metaSignal.confidence.score, 0),
  }
}

function buildReasons(
  candidate: Champion,
  context: RecommendationContext,
  dimensions: RecommendationDimensionScore[],
  scenario: RecommendationScenario,
): RecommendationReason[] {
  const reasons: RecommendationReason[] = []
  const allySynergy = getDimensionScore(dimensions, 'allySynergy').score
  const enemyCounter = getDimensionScore(dimensions, 'enemyCounter').score
  const compRepair = getDimensionScore(dimensions, 'compRepair').score
  const engageImpact = getDimensionScore(dimensions, 'engageImpact').score
  const peelImpact = getDimensionScore(dimensions, 'peelImpact').score
  const executionFit = getDimensionScore(dimensions, 'executionFit').score
  const comfortFit = getDimensionScore(dimensions, 'comfortFit').score
  const laneMatchupFit = getDimensionScore(dimensions, 'laneMatchupFit').score
  const objectiveSetupFit = getDimensionScore(dimensions, 'objectiveSetupFit').score
  const macroPostureFit = getDimensionScore(dimensions, 'macroPostureFit').score
  const poolEntry = context.poolEntriesByChampionId[candidate.id]
  const strongestSynergySignal = getStrongestSynergySignal(candidate, context)
  const strongestMatchupSignal = getStrongestMatchupSignal(candidate, context)
  const metaReason = buildMetaReason(candidate, context)
  const laneGuidance = scenario.draftContext.lanePhaseByRole[context.draftState.currentPickRole]
  const roleDanger = scenario.draftContext.matchupDangers.find((danger) => danger.role === context.draftState.currentPickRole)

  if (
    strongestSynergySignal &&
    strongestSynergySignal.synergyScore >= 8 &&
    strongestSynergySignal.confidence.level !== 'low'
  ) {
    reasons.push({
      id: `${candidate.id}-stats-synergy`,
      type: 'SYNERGY',
      direction: 'pro',
      label: 'Pairing data reinforces ally fit',
      explanation: `${candidate.name} has a strong recorded synergy signal with ${strongestSynergySignal.allyChampionId}.`,
      impact: roundTo(strongestSynergySignal.synergyScore * strongestSynergySignal.confidence.score, 0),
    })
  }

  if (peelImpact >= 8 && context.needs.needPeel >= 0.3) {
    reasons.push({
      id: `${candidate.id}-peel-repair`,
      type: 'REPAIR',
      direction: 'pro',
      label: 'Strong protection into current dive pressure',
      explanation:
        `${candidate.name} adds peel and disengage where the draft currently needs better carry protection.`,
      impact: roundTo(peelImpact, 0),
    })
  }

  if (engageImpact >= 8 && allySynergy >= 7.5) {
    reasons.push({
      id: `${candidate.id}-engage-synergy`,
      type: 'SYNERGY',
      direction: 'pro',
      label: 'Adds cleaner fight starts for the current shell',
      explanation:
        `${candidate.name} improves how reliably this comp can create picks or force coordinated objective fights.`,
      impact: roundTo(Math.max(engageImpact, allySynergy), 0),
    })
  }

  if (
    strongestMatchupSignal &&
    (strongestMatchupSignal.deltaWinRate ?? 0) > 0.01 &&
    strongestMatchupSignal.confidence.level !== 'low'
  ) {
    reasons.push({
      id: `${candidate.id}-stats-counter`,
      type: 'COUNTER',
      direction: 'pro',
      label: 'Historical matchup data is favorable',
      explanation: `${candidate.name} shows a positive matchup delta into ${strongestMatchupSignal.opponentChampionId}.`,
      impact: roundTo(
        mapDeltaWinRateToScore(strongestMatchupSignal.deltaWinRate, strongestMatchupSignal.lanePressure) *
          strongestMatchupSignal.confidence.score,
        0,
      ),
    })
  }

  if (enemyCounter >= 8) {
    reasons.push({
      id: `${candidate.id}-enemy-counter`,
      type: 'COUNTER',
      direction: 'pro',
      label: 'Improves the matchup profile into enemy threats',
      explanation:
        `${candidate.name} meaningfully interacts with the enemy pressure pattern instead of only helping your own comp.`,
      impact: roundTo(enemyCounter, 0),
    })
  }

  if (compRepair >= 8) {
    reasons.push({
      id: `${candidate.id}-comp-repair`,
      type: 'REPAIR',
      direction: 'pro',
      label: 'Directly patches current structural gaps',
      explanation:
        `${candidate.name} covers multiple current weaknesses instead of solving only one part of the draft.`,
      impact: roundTo(compRepair, 0),
    })
  }

  if (laneMatchupFit >= 8 && laneGuidance) {
    reasons.push({
      id: `${candidate.id}-lane-fit`,
      type: 'LANE',
      direction: 'pro',
      label: 'Fits the expected lane pattern well',
      explanation: roleDanger
        ? `${candidate.name} matches the lane requirement into ${roleDanger.type.toLowerCase().replace('_', ' ')} pressure and keeps the role more playable early.`
        : `${candidate.name} supports a strong ${laneGuidance.posture.toLowerCase().replaceAll('_', ' ')} lane posture for the current board.`,
      impact: roundTo(laneMatchupFit, 0),
    })
  }

  if (objectiveSetupFit >= 8) {
    reasons.push({
      id: `${candidate.id}-objective-fit`,
      type: 'OBJECTIVE',
      direction: 'pro',
      label: 'Improves how this comp wants to fight objectives',
      explanation:
        `${candidate.name} better supports the current objective call: ${scenario.draftContext.objectives.primaryCall.toLowerCase().replaceAll('_', ' ')}.`,
      impact: roundTo(objectiveSetupFit, 0),
    })
  }

  if (macroPostureFit >= 8) {
    reasons.push({
      id: `${candidate.id}-macro-posture`,
      type: 'POSTURE',
      direction: 'pro',
      label: 'Matches the team’s mid-game posture',
      explanation:
        `${candidate.name} fits a ${scenario.draftContext.midGame.posture.toLowerCase().replaceAll('_', ' ')} game plan better than a generic comfort pick would.`,
      impact: roundTo(macroPostureFit, 0),
    })
  }

  if (metaReason) {
    reasons.push(metaReason)
  }

  if (context.recommendationMode === 'PERSONAL_POOL' && poolEntry && comfortFit >= 7) {
    reasons.push({
      id: `${candidate.id}-pool-fit`,
      type: 'POOL',
      direction: 'pro',
      label: 'Strong within-pool execution value',
      explanation:
        `${candidate.name} is realistically playable for this user while still preserving strategic fit.`,
      impact: roundTo(comfortFit, 0),
    })
  }

  if (context.needs.needPeel >= 0.35 && candidate.traits.peel + candidate.traits.disengage < 4) {
    reasons.push({
      id: `${candidate.id}-peel-risk`,
      type: 'RISK',
      direction: 'con',
      label: 'Leaves the backline more exposed than ideal',
      explanation:
        `${candidate.name} improves some parts of the draft, but it does not fully solve the protection burden on the carry line.`,
      impact: roundTo(7 - peelImpact, 0),
    })
  }

  if (context.needs.needEngage >= 0.3 && candidate.traits.engage <= 1) {
    reasons.push({
      id: `${candidate.id}-engage-risk`,
      type: 'RISK',
      direction: 'con',
      label: 'Does not add much proactive threat',
      explanation:
        `${candidate.name} keeps more pressure on the existing engage champions to start fights cleanly.`,
      impact: roundTo(7 - engageImpact, 0),
    })
  }

  if (laneGuidance && laneMatchupFit < 6.1) {
    reasons.push({
      id: `${candidate.id}-lane-risk`,
      type: 'RISK',
      direction: 'con',
      label: 'Lane phase is less forgiving with this pick',
      explanation: roleDanger
        ? `${candidate.name} does not solve the current ${roleDanger.type.toLowerCase().replace('_', ' ')} lane pressure as cleanly as the better alternatives.`
        : `${candidate.name} gives less lane control than the better options for this board.`,
      impact: roundTo(7 - laneMatchupFit, 0),
    })
  }

  if (executionFit < 6.4) {
    reasons.push({
      id: `${candidate.id}-execution-risk`,
      type: 'RISK',
      direction: 'con',
      label: 'Execution burden is a bit higher here',
      explanation:
        `${candidate.name} offers upside, but the comp becomes less forgiving if the first sequence is mistimed.`,
      impact: roundTo(7 - executionFit, 0),
    })
  }

  return reasons.sort((left, right) => right.impact - left.impact).slice(0, 4)
}

function buildTags(
  candidate: Champion,
  context: RecommendationContext,
  dimensions: RecommendationDimensionScore[],
  scenario: RecommendationScenario,
) {
  const tags: string[] = []
  const engageImpact = getDimensionScore(dimensions, 'engageImpact').score
  const peelImpact = getDimensionScore(dimensions, 'peelImpact').score
  const compRepair = getDimensionScore(dimensions, 'compRepair').score
  const comfortFit = getDimensionScore(dimensions, 'comfortFit').score
  const laneMatchupFit = getDimensionScore(dimensions, 'laneMatchupFit').score
  const objectiveSetupFit = getDimensionScore(dimensions, 'objectiveSetupFit').score
  const macroPostureFit = getDimensionScore(dimensions, 'macroPostureFit').score
  const metaSignal = context.statsBundle
    ? getChampionMetaSignal(context.statsBundle, candidate.id, context.draftState.currentPickRole)
    : undefined

  if (context.recommendationMode === 'PERSONAL_POOL' && context.poolEntriesByChampionId[candidate.id]) {
    tags.push('Inside pool')
  }

  if (compRepair >= 8.5) {
    tags.push('Best comp repair')
  }

  if (peelImpact >= 8.5) {
    tags.push('Anti-dive')
  }

  if (engageImpact >= 8.5) {
    tags.push('Hard engage')
  }

  if (getDimensionScore(dimensions, 'executionFit').score >= 8.2) {
    tags.push('Safer execution')
  }

  if (comfortFit >= 8.5 && context.recommendationMode === 'PERSONAL_POOL') {
    tags.push('High comfort')
  }

  if (getDimensionScore(dimensions, 'enemyCounter').score >= 8) {
    tags.push('Good into enemy comp')
  }

  if (laneMatchupFit >= 8.2) {
    tags.push('Stable lane')
  }

  if (objectiveSetupFit >= 8.2) {
    tags.push(
      scenario.draftContext.objectives.primaryCall === 'TURN_ON_ENTRY' ? 'Strong objective turn' : 'Objective fit',
    )
  }

  if (macroPostureFit >= 8.2) {
    tags.push('Macro fit')
  }

  if (metaSignal && (metaSignal.tier === 'S' || metaSignal.tier === 'A')) {
    tags.push('Patch favored')
  }

  return unique(tags).slice(0, 4)
}

function buildConfidence(totalScore: number, context: RecommendationContext) {
  const draftCompleteness =
    (countFilledSlots(context.draftState.allyTeam) + countFilledSlots(context.draftState.enemyTeam)) / 10

  if (draftCompleteness >= 0.8 && totalScore >= 78) {
    return 'high'
  }

  if (draftCompleteness >= 0.5 && totalScore >= 62) {
    return 'medium'
  }

  return 'low'
}

function buildNarrative(
  candidate: Champion,
  context: RecommendationContext,
  dimensions: RecommendationDimensionScore[],
  scenario: RecommendationScenario,
  reasons: RecommendationReason[],
): RecommendationNarrative {
  const topReasons = reasons.filter((reason) => reason.direction === 'pro').slice(0, 3)
  const topDimensions = [...dimensions].sort((left, right) => right.contribution - left.contribution).slice(0, 3)
  const currentRole = context.draftState.currentPickRole.toLowerCase()
  const objectiveCall = scenario.draftContext.objectives.primaryCall.toLowerCase().replaceAll('_', ' ')
  const posture = scenario.draftContext.midGame.posture.toLowerCase().replaceAll('_', ' ')

  return {
    headline: `Pick ${candidate.name} for ${currentRole}`,
    summary:
      topReasons.length > 0
        ? `${candidate.name} is recommended because it best supports your current ${currentRole} game: ${topReasons
            .map((reason) => reason.label.toLowerCase())
            .join(', ')}. It also fits a ${posture} mid game and a ${objectiveCall} objective plan.`
        : `${candidate.name} is the strongest deterministic fit for your ${currentRole} slot on the current board.`,
    decisionFactors: [
      ...topReasons.map((reason) => reason.explanation),
      ...topDimensions.map(
        (dimension) => `${dimension.dimension} scored ${dimension.score.toFixed(1)} and materially improved this candidate's final rank.`,
      ),
    ].slice(0, 4),
  }
}

function toRecommendationCandidate(candidate: Champion, context: RecommendationContext): RecommendationCandidate {
  const scenario = buildRecommendationScenarioForChampion(candidate, context)
  const dimensions = buildDimensionScores(candidate, context, scenario)
  const reasons = buildReasons(candidate, context, dimensions, scenario)
  const totalWeightedContribution = sum(dimensions.map((dimension) => dimension.contribution))
  const maxPossibleContribution = sum(dimensions.map((dimension) => dimension.weight * 10)) || 1
  const totalScore = roundTo((totalWeightedContribution / maxPossibleContribution) * 100, 0)

  return {
    championId: candidate.id,
    championName: candidate.name,
    recommendationMode: context.recommendationMode,
    tags: buildTags(candidate, context, dimensions, scenario),
    breakdown: {
      totalScore,
      confidence: buildConfidence(totalScore, context),
      dimensions,
      reasons,
    },
    narrative: buildNarrative(candidate, context, dimensions, scenario, reasons),
  }
}

export function recommendChampionsForDraft({
  draftState,
  championsById,
  recommendationMode = draftState.recommendationMode,
  championPool,
  statsBundle,
  topN = 5,
}: RecommendChampionsForDraftInput): RecommendationCandidate[] {
  if (recommendationMode === 'PERSONAL_POOL' && !championPool) {
    return []
  }

  const allyProfile = analyzeDraftComposition({ draftState, championsById, side: 'ALLY' })
  const enemyProfile = analyzeDraftComposition({ draftState, championsById, side: 'ENEMY' })
  const context: RecommendationContext = {
    draftState,
    championsById,
    recommendationMode,
    allyProfile,
    enemyProfile,
    championPool,
    poolEntriesByChampionId: getPoolEntriesByChampionId(championPool),
    weights: getWeightsForMode(draftState.productMode, recommendationMode),
    needs: createNeeds(allyProfile, enemyProfile),
    statsBundle,
  }

  return getCandidateChampions({ draftState, championsById, recommendationMode, championPool, statsBundle })
    .map((candidate) => toRecommendationCandidate(candidate, context))
    .sort((left, right) => right.breakdown.totalScore - left.breakdown.totalScore)
    .slice(0, topN)
}
