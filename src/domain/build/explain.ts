import type { BuildContext, ChampionBuildProfile, ChampionBuildRecommendation } from '@/domain/build/types'
import type { RecommendationCandidate } from '@/domain/recommendation/types'

export function buildBuildExplanation({
  recommendation,
  build,
  profile,
  context,
}: {
  recommendation: RecommendationCandidate
  build: Omit<ChampionBuildRecommendation, 'explanation'>
  profile: ChampionBuildProfile
  context: BuildContext
}): ChampionBuildRecommendation['explanation'] {
  const modeLabel = recommendation.recommendationMode === 'PERSONAL_POOL' ? 'your best in-pool build path' : 'the strongest current build path'
  const topBranches = build.situationalBranches.slice(0, 2)

  return {
    headline: `${recommendation.championName}: ${modeLabel}`,
    summary:
      `${recommendation.championName} keeps a ${profile.archetype.toLowerCase().replaceAll('_', ' ')} baseline here, ` +
      `then adjusts for ${context.objectiveCall.toLowerCase().replaceAll('_', ' ')} objective setups and a ` +
      `${context.midGamePosture.toLowerCase().replaceAll('_', ' ')} mid game.`,
    bullets: [
      build.starter ? `Start with ${build.starter.items.map((item) => item.itemName).join(', ')} to keep the early lane plan playable.` : undefined,
      build.firstBuy
        ? `First buy toward ${build.firstBuy.items.map((item) => item.itemName).join(', ')} so the first recall matches the expected threat pattern.`
        : undefined,
      build.corePath.length > 0
        ? `Core path: ${build.corePath.flatMap((step) => step.items.map((item) => item.itemName)).join(' -> ')}.`
        : undefined,
      ...topBranches.map((branch) => `${branch.label}: ${branch.explanation}`),
      profile.source === 'SCAFFOLDED'
        ? 'This build profile is scaffolded from role and trait data, so exact matchup-perfect tuning still needs curated champion build data.'
        : 'This build profile is curated, but it still uses deterministic board signals rather than pretending static patch data alone solves every matchup.' ,
    ].filter((bullet): bullet is string => Boolean(bullet)).slice(0, 5),
  }
}
