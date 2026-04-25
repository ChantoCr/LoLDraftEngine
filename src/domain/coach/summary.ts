import type { Champion } from '@/domain/champion/types'
import { getDraftSlot } from '@/domain/draft/selectors'
import type { DraftState } from '@/domain/draft/types'
import type { CompositionProfile } from '@/domain/composition/types'
import type { LiveGamePlan } from '@/domain/game-plan/types'

interface BuildCoachSummaryInput {
  draftState: DraftState
  championsById: Record<string, Champion>
  compositionProfile: CompositionProfile
  bestOverallLabel?: string
  bestPoolLabel?: string
  gamePlan?: LiveGamePlan
}

function buildChampionExecutionAdvice(champion: Champion) {
  const advice: string[] = []

  if (champion.traits.engage >= 3 || champion.traits.frontline >= 3) {
    advice.push('look for first-move windows around vision and objectives instead of waiting for the enemy to start cleanly')
  }

  if (champion.traits.peel >= 3 || champion.traits.disengage >= 3) {
    advice.push('hold key peel tools for the first enemy access attempt and protect your most important carry through that window')
  }

  if (champion.traits.poke >= 3) {
    advice.push('chip targets and control space before forcing a full commit')
  }

  if (champion.traits.pick >= 3) {
    advice.push('play around vision denial and catches rather than forcing every fight frontally')
  }

  if (champion.traits.dive >= 3) {
    advice.push('sync flank timing with the rest of your team so your entry is not isolated')
  }

  if (champion.traits.scaling >= 3) {
    advice.push('respect early volatility and trade toward stronger item or level breakpoints')
  }

  if (advice.length === 0) {
    advice.push('play around your team’s strongest cooldowns and avoid isolated fights that ignore comp structure')
  }

  return advice.slice(0, 2)
}

export function buildCoachSummary({
  draftState,
  championsById,
  compositionProfile,
  bestOverallLabel,
  bestPoolLabel,
  gamePlan,
}: BuildCoachSummaryInput) {
  const currentSlot = getDraftSlot(draftState.allyTeam, draftState.currentPickRole)
  const currentChampion = currentSlot?.championId ? championsById[currentSlot.championId] : undefined
  const primaryWinCondition = compositionProfile.winConditions[0]?.toLowerCase() ?? 'play toward your strongest coordinated fight pattern'
  const primaryWeakness = compositionProfile.weaknesses[0]?.toLowerCase() ?? 'avoid structural mistakes that expose your carries'

  if (currentChampion) {
    const executionAdvice = buildChampionExecutionAdvice(currentChampion)
      .map((sentence) => sentence.charAt(0).toUpperCase() + sentence.slice(1))
      .join('. ')

    const laneSummary = gamePlan?.lanePhase?.summary ? ` Lane phase: ${gamePlan.lanePhase.summary}` : ''
    const midGameSummary = gamePlan?.midGame?.summary ? ` Mid game: ${gamePlan.midGame.summary}` : ''

    return `On ${currentChampion.name} ${draftState.currentPickRole}, your job is to ${executionAdvice}. As a team, you win by ${primaryWinCondition}. Be careful to ${primaryWeakness}.${laneSummary}${midGameSummary}`
  }

  const firstGap = compositionProfile.structuralGaps[0]?.toLowerCase() ?? 'draft cohesion'
  const bestOverall = bestOverallLabel ?? 'no available champion'
  const bestPool = bestPoolLabel ?? 'no available pool candidate'

  return `The current draft is most sensitive to ${firstGap}. ${bestOverall} is the strongest theoretical answer, while ${bestPool} is the best current pool-aware option. Structured patch signals are blended into synergy, matchup, and meta scoring, while the deterministic engine remains the source of truth.`
}
