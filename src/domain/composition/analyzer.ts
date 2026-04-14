import type { Champion } from '@/domain/champion/types'
import { average, clamp, roundTo, unique } from '@/domain/common/math'
import { getTeamDraft } from '@/domain/draft/selectors'
import type { DraftState, TeamDraft, TeamSide } from '@/domain/draft/types'
import { ARCHETYPE_SCORING_WEIGHTS, COMPOSITION_THRESHOLDS, TRAIT_KEYS } from './constants'
import type {
  ArchetypeScore,
  CompositionArchetype,
  CompositionProfile,
  DamageProfileSummary,
  DraftAlert,
  ExecutionDifficulty,
  TraitName,
  TraitScoreMap,
} from './types'

interface AnalyzeTeamCompositionInput {
  teamDraft: TeamDraft
  enemyTeamDraft?: TeamDraft
  championsById: Record<string, Champion>
  currentPickRole?: string
}

interface AnalyzeDraftCompositionInput {
  draftState: DraftState
  championsById: Record<string, Champion>
  side?: TeamSide
}

function createEmptyTraitScoreMap(): TraitScoreMap {
  return {
    engage: 0,
    disengage: 0,
    peel: 0,
    poke: 0,
    scaling: 0,
    dive: 0,
    pick: 0,
    frontline: 0,
  }
}

function getPickedChampions(teamDraft: TeamDraft, championsById: Record<string, Champion>) {
  return teamDraft.picks.flatMap((slot) => {
    if (!slot.championId) {
      return []
    }

    const champion = championsById[slot.championId]

    return champion ? [champion] : []
  })
}

function aggregateTraitTotals(champions: Champion[]) {
  return champions.reduce<TraitScoreMap>((totals, champion) => {
    for (const trait of TRAIT_KEYS) {
      totals[trait] += champion.traits[trait]
    }

    return totals
  }, createEmptyTraitScoreMap())
}

function toAverageTraits(traitTotals: TraitScoreMap, pickedCount: number) {
  const safePickedCount = pickedCount || 1

  return TRAIT_KEYS.reduce<TraitScoreMap>((averages, trait) => {
    averages[trait] = roundTo(traitTotals[trait] / safePickedCount, 2)
    return averages
  }, createEmptyTraitScoreMap())
}

function buildDamageProfileSummary(champions: Champion[]): DamageProfileSummary {
  let physical = 0
  let magic = 0
  let mixed = 0

  for (const champion of champions) {
    if (champion.traits.damageProfile === 'PHYSICAL') {
      physical += 1
    }

    if (champion.traits.damageProfile === 'MAGIC') {
      magic += 1
    }

    if (champion.traits.damageProfile === 'MIXED') {
      mixed += 1
    }
  }

  const effectivePhysical = physical + mixed * 0.5
  const effectiveMagic = magic + mixed * 0.5
  const leaning =
    effectivePhysical - effectiveMagic >= 1.5
      ? 'AD_HEAVY'
      : effectiveMagic - effectivePhysical >= 1.5
        ? 'AP_HEAVY'
        : 'BALANCED'

  return {
    physical,
    magic,
    mixed,
    leaning,
  }
}

function scoreArchetypes(averageTraits: TraitScoreMap): ArchetypeScore[] {
  return Object.entries(ARCHETYPE_SCORING_WEIGHTS)
    .map(([archetype, traitWeights]) => {
      const score = Object.entries(traitWeights).reduce((total, [trait, weight]) => {
        return total + averageTraits[trait as TraitName] * weight
      }, 0)

      return {
        archetype: archetype as CompositionArchetype,
        score: roundTo(clamp(score, 0, 5), 2),
      }
    })
    .sort((left, right) => right.score - left.score)
}

function selectArchetypes(archetypeScores: ArchetypeScore[]) {
  const primaryArchetypes = archetypeScores
    .filter((entry) => entry.score >= COMPOSITION_THRESHOLDS.strongArchetype)
    .slice(0, 3)
    .map((entry) => entry.archetype)

  if (primaryArchetypes.length === 0 && archetypeScores[0]?.score) {
    primaryArchetypes.push(archetypeScores[0].archetype)
  }

  if (
    archetypeScores[0] &&
    archetypeScores[1] &&
    archetypeScores[0].score - archetypeScores[1].score <= 0.45 &&
    archetypeScores[1].score >= COMPOSITION_THRESHOLDS.secondaryArchetype
  ) {
    primaryArchetypes.push('HYBRID')
  }

  return unique(primaryArchetypes)
}

function buildStructuralGaps(
  averageTraits: TraitScoreMap,
  damageProfile: DamageProfileSummary,
  enemyAverageTraits?: TraitScoreMap,
) {
  const gaps: string[] = []

  if (averageTraits.frontline < COMPOSITION_THRESHOLDS.lowFrontline) {
    gaps.push('Reliable frontline')
  }

  if (averageTraits.engage < COMPOSITION_THRESHOLDS.lowEngage) {
    gaps.push('Reliable engage')
  }

  if (averageTraits.peel < COMPOSITION_THRESHOLDS.lowPeel) {
    gaps.push('Backline peel')
  }

  if (averageTraits.scaling < COMPOSITION_THRESHOLDS.lowScaling) {
    gaps.push('Late-game scaling insurance')
  }

  if (damageProfile.leaning === 'AD_HEAVY') {
    gaps.push('Magic damage balance')
  }

  if (damageProfile.leaning === 'AP_HEAVY') {
    gaps.push('Physical damage balance')
  }

  if (enemyAverageTraits) {
    const enemyDivePressure = average([enemyAverageTraits.dive, enemyAverageTraits.pick])
    if (enemyDivePressure >= COMPOSITION_THRESHOLDS.enemyDivePressure && averageTraits.peel < 2.35) {
      gaps.push('Anti-dive peel')
    }

    if (enemyAverageTraits.poke >= COMPOSITION_THRESHOLDS.enemyPokePressure && averageTraits.engage < 2.1) {
      gaps.push('Reliable access into ranged setups')
    }
  }

  return unique(gaps)
}

function buildStrengths(
  archetypes: CompositionArchetype[],
  averageTraits: TraitScoreMap,
  damageProfile: DamageProfileSummary,
) {
  const strengths: string[] = []

  if (archetypes.includes('ENGAGE')) {
    strengths.push('Reliable engage tools let the team start fights on its own terms.')
  }

  if (archetypes.includes('FRONT_TO_BACK')) {
    strengths.push('The composition can win extended front-to-back fights when the carry line is protected.')
  }

  if (archetypes.includes('SCALING')) {
    strengths.push('Scaling profile is healthy enough to punish slower games and longer objective setups.')
  }

  if (archetypes.includes('PICK')) {
    strengths.push('Pick pressure creates windows to convert catches into neutral-objective control.')
  }

  if (damageProfile.leaning === 'BALANCED') {
    strengths.push('Damage profile is reasonably balanced, making defensive itemization harder for the enemy.')
  }

  if (averageTraits.frontline >= 2.5) {
    strengths.push('Frontline density is solid enough to absorb the first cooldown cycle.')
  }

  return strengths.slice(0, 4)
}

function buildWeaknesses(structuralGaps: string[]) {
  return structuralGaps.map((gap) => {
    switch (gap) {
      case 'Reliable frontline':
        return 'The current champions do not create enough front-line stability for clean objective fights.'
      case 'Reliable engage':
        return 'The draft may struggle to force starts when the enemy refuses to walk into range.'
      case 'Backline peel':
        return 'The backline currently lacks enough peel to survive the first dive or pick attempt.'
      case 'Late-game scaling insurance':
        return 'If the game stalls, the composition may run out of reliable late-fight damage or value.'
      case 'Magic damage balance':
        return 'The current draft leans too physical and risks becoming easy to itemize against.'
      case 'Physical damage balance':
        return 'The current draft leans too magic-heavy and could become predictable in damage profile.'
      case 'Anti-dive peel':
        return 'Enemy access tools put extra pressure on your carries because anti-dive coverage is still thin.'
      case 'Reliable access into ranged setups':
        return 'Against ranged poke and spacing, the comp still needs a cleaner way to close distance.'
      default:
        return `The comp still needs help with ${gap.toLowerCase()}.`
    }
  })
}

function buildExecutionDifficulty(
  averageTraits: TraitScoreMap,
  archetypes: CompositionArchetype[],
  structuralGaps: string[],
): ExecutionDifficulty {
  let difficultyScore = 0

  if (archetypes.includes('ENGAGE')) {
    difficultyScore += 0.9
  }

  if (archetypes.includes('DIVE')) {
    difficultyScore += 0.9
  }

  if (archetypes.includes('HYBRID')) {
    difficultyScore += 0.5
  }

  if (averageTraits.scaling >= 2.8 && averageTraits.peel < 2) {
    difficultyScore += 0.8
  }

  if (structuralGaps.includes('Reliable frontline')) {
    difficultyScore += 0.6
  }

  if (structuralGaps.includes('Anti-dive peel')) {
    difficultyScore += 0.7
  }

  difficultyScore -= averageTraits.frontline >= 2.5 ? 0.4 : 0
  difficultyScore -= averageTraits.peel >= 2.5 ? 0.3 : 0

  if (difficultyScore >= 2.4) {
    return 'HIGH'
  }

  if (difficultyScore >= 1.2) {
    return 'MEDIUM'
  }

  return 'LOW'
}

function buildWinConditions(
  archetypes: CompositionArchetype[],
  averageTraits: TraitScoreMap,
  enemyAverageTraits?: TraitScoreMap,
) {
  const winConditions: string[] = []

  if (archetypes.includes('ENGAGE')) {
    winConditions.push('Start fights first around objectives and layer crowd control before the enemy resets spacing.')
  }

  if (archetypes.includes('FRONT_TO_BACK') || archetypes.includes('PEEL')) {
    winConditions.push('Extend fights, protect the primary carry through the first dive window, and win the second rotation.')
  }

  if (archetypes.includes('SCALING')) {
    winConditions.push('Trade tempo when necessary, reach stronger item breakpoints, and force decisive mid-to-late objective setups.')
  }

  if (archetypes.includes('PICK')) {
    winConditions.push('Use vision and catch tools to create numbers advantages before major neutral fights.')
  }

  if (enemyAverageTraits && enemyAverageTraits.poke >= COMPOSITION_THRESHOLDS.enemyPokePressure && averageTraits.engage >= 2) {
    winConditions.push('Deny drawn-out poke sequences by committing once the enemy ranged setup steps too far forward.')
  }

  return unique(winConditions).slice(0, 3)
}

function buildAlerts(
  structuralGaps: string[],
  currentPickRole: string | undefined,
  enemyAverageTraits?: TraitScoreMap,
): DraftAlert[] {
  const alerts: DraftAlert[] = []

  if (structuralGaps.includes('Anti-dive peel')) {
    alerts.push({
      id: 'anti-dive-peel',
      severity: 'warning',
      title: 'Anti-dive coverage is light',
      description:
        'Current carry protection is thin relative to the enemy access tools, so the next pick has high repair value.',
    })
  }

  if (structuralGaps.includes('Reliable frontline')) {
    alerts.push({
      id: 'frontline-light',
      severity: 'warning',
      title: 'Frontline is lighter than ideal',
      description: 'Without more front-line stability, the draft may struggle to hold formation in objective fights.',
    })
  }

  if (structuralGaps.includes('Magic damage balance') || structuralGaps.includes('Physical damage balance')) {
    alerts.push({
      id: 'damage-balance',
      severity: 'info',
      title: 'Damage profile is skewed',
      description: 'A more balanced final draft will make defensive itemization harder for the enemy team.',
    })
  }

  if (currentPickRole && structuralGaps.length > 0) {
    alerts.push({
      id: 'open-slot-defines-identity',
      severity: enemyAverageTraits && average([enemyAverageTraits.dive, enemyAverageTraits.pick]) > 2.4 ? 'warning' : 'info',
      title: `${currentPickRole} pick will define the final identity`,
      description:
        'The open slot meaningfully changes whether this draft finishes as proactive engage, protected front-to-back, or hybrid utility.',
    })
  }

  return alerts.slice(0, 3)
}

export function analyzeTeamComposition({
  teamDraft,
  enemyTeamDraft,
  championsById,
  currentPickRole,
}: AnalyzeTeamCompositionInput): CompositionProfile {
  const pickedChampions = getPickedChampions(teamDraft, championsById)
  const enemyChampions = enemyTeamDraft ? getPickedChampions(enemyTeamDraft, championsById) : []
  const championIds = pickedChampions.map((champion) => champion.id)
  const pickedCount = pickedChampions.length
  const traitTotals = aggregateTraitTotals(pickedChampions)
  const averageTraits = toAverageTraits(traitTotals, pickedCount)
  const enemyAverageTraits = toAverageTraits(aggregateTraitTotals(enemyChampions), enemyChampions.length)
  const damageProfile = buildDamageProfileSummary(pickedChampions)
  const archetypeScores = scoreArchetypes(averageTraits)
  const archetypes = selectArchetypes(archetypeScores)
  const structuralGaps = buildStructuralGaps(averageTraits, damageProfile, enemyChampions.length ? enemyAverageTraits : undefined)
  const strengths = buildStrengths(archetypes, averageTraits, damageProfile)
  const weaknesses = buildWeaknesses(structuralGaps)
  const executionDifficulty = buildExecutionDifficulty(averageTraits, archetypes, structuralGaps)
  const winConditions = buildWinConditions(
    archetypes,
    averageTraits,
    enemyChampions.length ? enemyAverageTraits : undefined,
  )
  const alerts = buildAlerts(structuralGaps, currentPickRole, enemyChampions.length ? enemyAverageTraits : undefined)

  return {
    championIds,
    pickedCount,
    traitTotals,
    averageTraits,
    damageProfile,
    archetypeScores,
    archetypes,
    strengths,
    weaknesses,
    structuralGaps,
    executionDifficulty,
    winConditions,
    alerts,
  }
}

export function analyzeDraftComposition({
  draftState,
  championsById,
  side = 'ALLY',
}: AnalyzeDraftCompositionInput): CompositionProfile {
  const teamDraft = getTeamDraft(draftState, side)
  const enemyTeamDraft = getTeamDraft(draftState, side === 'ALLY' ? 'ENEMY' : 'ALLY')

  return analyzeTeamComposition({
    teamDraft,
    enemyTeamDraft,
    championsById,
    currentPickRole: draftState.currentPickRole,
  })
}
