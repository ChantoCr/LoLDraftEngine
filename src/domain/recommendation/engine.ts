import type { ChampionPoolEntry, ChampionPoolProfile, ChampionPoolTier } from '@/domain/champion-pool/types'
import type { Champion } from '@/domain/champion/types'
import { clamp, roundTo, sum, unique } from '@/domain/common/math'
import { analyzeDraftComposition } from '@/domain/composition/analyzer'
import type { CompositionProfile } from '@/domain/composition/types'
import { countFilledSlots, isChampionAvailable } from '@/domain/draft/selectors'
import type { DraftState, RecommendationMode } from '@/domain/draft/types'
import { RECOMMENDATION_WEIGHTS_BY_MODE, type RecommendationWeights } from '@/domain/recommendation/config'
import type {
  RecommendationCandidate,
  RecommendationDimension,
  RecommendationDimensionScore,
  RecommendationReason,
} from '@/domain/recommendation/types'

interface RecommendChampionsForDraftInput {
  draftState: DraftState
  championsById: Record<string, Champion>
  recommendationMode?: RecommendationMode
  championPool?: ChampionPoolProfile
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
  recommendationMode: RecommendationMode
  allyProfile: CompositionProfile
  enemyProfile: CompositionProfile
  championPool?: ChampionPoolProfile
  poolEntriesByChampionId: Record<string, ChampionPoolEntry>
  weights: RecommendationWeights
  needs: RecommendationNeeds
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

function scoreAllySynergy(candidate: Champion, allyProfile: CompositionProfile) {
  const rawScore =
    candidate.traits.engage * (allyProfile.averageTraits.engage * 0.5 + allyProfile.averageTraits.scaling * 0.35) +
    candidate.traits.peel * (allyProfile.averageTraits.scaling * 0.55 + allyProfile.averageTraits.frontline * 0.15) +
    candidate.traits.frontline * (allyProfile.averageTraits.scaling * 0.35 + allyProfile.averageTraits.peel * 0.15) +
    candidate.traits.pick * allyProfile.averageTraits.engage * 0.2

  return clamp(roundTo(rawScore / 2.7, 1), 0, 10)
}

function scoreEnemyCounter(candidate: Champion, enemyProfile: CompositionProfile) {
  const antiDive =
    (candidate.traits.peel * 0.7 + candidate.traits.disengage * 0.3) *
    (enemyProfile.averageTraits.dive * 0.55 + enemyProfile.averageTraits.pick * 0.45)
  const antiPoke = candidate.traits.engage * enemyProfile.averageTraits.poke * 0.3
  const antiPick = candidate.traits.frontline * enemyProfile.averageTraits.pick * 0.25

  return clamp(roundTo((antiDive + antiPoke + antiPick) / 1.2, 1), 0, 10)
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
  const compBurden = context.allyProfile.executionDifficulty === 'HIGH' ? 1.4 : context.allyProfile.executionDifficulty === 'MEDIUM' ? 0.8 : 0.2

  if (context.draftState.productMode === 'COMPETITIVE') {
    return clamp(roundTo(5.8 + aggression * 0.65 + stability * 0.2 - compBurden, 1), 0, 10)
  }

  if (context.draftState.productMode === 'CLASH') {
    return clamp(roundTo(7 + stability * 0.45 + aggression * 0.15 - compBurden * 0.8, 1), 0, 10)
  }

  return clamp(roundTo(8.8 + stability * 0.35 - aggression * 0.25 - compBurden, 1), 0, 10)
}

function scoreMetaValue(candidate: Champion) {
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

  return clamp(roundTo(activeTraits * 0.7 + topTraitAverage * 1.4, 1), 0, 10)
}

function scoreComfortFit(candidate: Champion, context: RecommendationContext) {
  const poolEntry = context.poolEntriesByChampionId[candidate.id]

  if (!poolEntry) {
    return context.recommendationMode === 'PERSONAL_POOL' ? 0 : 5
  }

  const baseScore = getTierBaseScore(poolEntry.tier)
  return clamp(roundTo(baseScore * 0.75 + poolEntry.masteryConfidence * 10 * 0.25, 1), 0, 10)
}

function buildDimensionScores(candidate: Champion, context: RecommendationContext): RecommendationDimensionScore[] {
  const dimensions: Record<RecommendationDimension, number> = {
    allySynergy: scoreAllySynergy(candidate, context.allyProfile),
    enemyCounter: scoreEnemyCounter(candidate, context.enemyProfile),
    compRepair: scoreCompRepair(candidate, context.allyProfile, context.needs),
    damageBalance: scoreDamageBalance(candidate, context.allyProfile),
    frontlineImpact: scaleTraitScore(candidate.traits.frontline, 0.8 + context.needs.needFrontline * 0.8),
    engageImpact: scaleTraitScore(candidate.traits.engage, 0.75 + context.needs.needEngage * 0.7),
    peelImpact: scaleTraitScore(
      candidate.traits.peel * 0.7 + candidate.traits.disengage * 0.3,
      0.8 + context.needs.needPeel * 0.8,
    ),
    executionFit: scoreExecutionFit(candidate, context),
    metaValue: scoreMetaValue(candidate),
    comfortFit: scoreComfortFit(candidate, context),
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

function buildReasons(
  candidate: Champion,
  context: RecommendationContext,
  dimensions: RecommendationDimensionScore[],
): RecommendationReason[] {
  const reasons: RecommendationReason[] = []
  const allySynergy = getDimensionScore(dimensions, 'allySynergy').score
  const enemyCounter = getDimensionScore(dimensions, 'enemyCounter').score
  const compRepair = getDimensionScore(dimensions, 'compRepair').score
  const engageImpact = getDimensionScore(dimensions, 'engageImpact').score
  const peelImpact = getDimensionScore(dimensions, 'peelImpact').score
  const executionFit = getDimensionScore(dimensions, 'executionFit').score
  const comfortFit = getDimensionScore(dimensions, 'comfortFit').score
  const poolEntry = context.poolEntriesByChampionId[candidate.id]

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

  return reasons.sort((left, right) => right.impact - left.impact).slice(0, 3)
}

function buildTags(
  candidate: Champion,
  context: RecommendationContext,
  dimensions: RecommendationDimensionScore[],
) {
  const tags: string[] = []
  const engageImpact = getDimensionScore(dimensions, 'engageImpact').score
  const peelImpact = getDimensionScore(dimensions, 'peelImpact').score
  const compRepair = getDimensionScore(dimensions, 'compRepair').score
  const comfortFit = getDimensionScore(dimensions, 'comfortFit').score

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

  return unique(tags).slice(0, 3)
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

function toRecommendationCandidate(candidate: Champion, context: RecommendationContext): RecommendationCandidate {
  const dimensions = buildDimensionScores(candidate, context)
  const totalWeightedContribution = sum(dimensions.map((dimension) => dimension.contribution))
  const maxPossibleContribution = sum(dimensions.map((dimension) => dimension.weight * 10)) || 1
  const totalScore = roundTo((totalWeightedContribution / maxPossibleContribution) * 100, 0)

  return {
    championId: candidate.id,
    championName: candidate.name,
    recommendationMode: context.recommendationMode,
    tags: buildTags(candidate, context, dimensions),
    breakdown: {
      totalScore,
      confidence: buildConfidence(totalScore, context),
      dimensions,
      reasons: buildReasons(candidate, context, dimensions),
    },
  }
}

export function recommendChampionsForDraft({
  draftState,
  championsById,
  recommendationMode = draftState.recommendationMode,
  championPool,
  topN = 5,
}: RecommendChampionsForDraftInput): RecommendationCandidate[] {
  if (recommendationMode === 'PERSONAL_POOL' && !championPool) {
    return []
  }

  const allyProfile = analyzeDraftComposition({ draftState, championsById, side: 'ALLY' })
  const enemyProfile = analyzeDraftComposition({ draftState, championsById, side: 'ENEMY' })
  const context: RecommendationContext = {
    draftState,
    recommendationMode,
    allyProfile,
    enemyProfile,
    championPool,
    poolEntriesByChampionId: getPoolEntriesByChampionId(championPool),
    weights: getWeightsForMode(draftState.productMode, recommendationMode),
    needs: createNeeds(allyProfile, enemyProfile),
  }

  return getCandidateChampions({ draftState, championsById, recommendationMode, championPool })
    .map((candidate) => toRecommendationCandidate(candidate, context))
    .sort((left, right) => right.breakdown.totalScore - left.breakdown.totalScore)
    .slice(0, topN)
}
