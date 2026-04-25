import { buildBuildContext } from '@/domain/build/context'
import { buildBuildExplanation } from '@/domain/build/explain'
import { getItemReferences } from '@/domain/build/itemCatalog'
import type {
  BuildAdjustment,
  BuildContext,
  BuildStep,
  BuildTrigger,
  ChampionBuildProfile,
  ChampionBuildRecommendation,
  SituationalBuildBranch,
} from '@/domain/build/types'
import type { Champion } from '@/domain/champion/types'
import { unique } from '@/domain/common/math'
import type { RecommendationCandidate, RecommendationScenario } from '@/domain/recommendation/types'

function getThreat(context: BuildContext, trigger: BuildTrigger) {
  return context.activeThreats.find((threat) => threat.trigger === trigger)
}

function buildStep(
  phase: BuildStep['phase'],
  label: string,
  itemIds: string[],
  explanation: string,
  confidence: BuildStep['confidence'],
): BuildStep {
  return {
    phase,
    label,
    items: getItemReferences(itemIds),
    explanation,
    confidence,
  }
}

function pickStarterItemIds(profile: ChampionBuildProfile, context: BuildContext) {
  if (profile.archetype === 'CRIT_MARKSMAN' && (getThreat(context, 'HIGH_POKE') || context.lanePosture === 'STABILIZE')) {
    return ['doran-shield', 'health-potion']
  }

  if (
    (profile.archetype === 'POKE_FIGHTER' || profile.archetype === 'DIVER_BRUISER') &&
    (getThreat(context, 'HIGH_POKE') || context.primaryMatchupDanger === 'POKE')
  ) {
    return ['doran-shield', 'health-potion']
  }

  return profile.defaultStarterItemIds
}

function pickFirstBuyItemIds(profile: ChampionBuildProfile, context: BuildContext) {
  const heavyPhysical = Boolean(getThreat(context, 'HEAVY_PHYSICAL'))
  const heavyMagic = Boolean(getThreat(context, 'HEAVY_MAGIC'))
  const highDive = Boolean(getThreat(context, 'HIGH_DIVE'))
  const highBurst = Boolean(getThreat(context, 'HIGH_BURST'))
  const highPoke = Boolean(getThreat(context, 'HIGH_POKE'))
  const highPick = Boolean(getThreat(context, 'HIGH_PICK'))
  const highHealing = Boolean(getThreat(context, 'HIGH_HEALING'))

  if (profile.archetype === 'ENGAGE_TANK_SUPPORT' || profile.archetype === 'PEEL_TANK_SUPPORT' || profile.archetype === 'TANK_JUNGLER') {
    if (context.primaryMatchupDanger === 'POKE' || context.lanePosture === 'PROTECT_WAVE' || highPoke) {
      return ['boots', 'ruby-crystal']
    }

    if (heavyPhysical || context.primaryMatchupDanger === 'ALL_IN' || context.primaryMatchupDanger === 'DIVE') {
      return ['kindlegem', 'cloth-armor']
    }

    if (heavyMagic) {
      return ['kindlegem', 'null-magic-mantle']
    }
  }

  if (profile.archetype === 'ENCHANTER_UTILITY') {
    if (context.primaryMatchupDanger === 'POKE' || highPoke) {
      return ['forbidden-idol', 'boots']
    }

    if (highPick || getThreat(context, 'HIGH_CC')) {
      return ['forbidden-idol', 'boots']
    }
  }

  if (profile.archetype === 'CONTROL_MAGE') {
    if (heavyPhysical && (highDive || highBurst || context.primaryMatchupDanger === 'ALL_IN' || context.primaryMatchupDanger === 'DIVE')) {
      return ['seekers-armguard', 'boots']
    }

    if (highHealing) {
      return ['oblivion-orb', 'boots']
    }

    if (highPick || context.primaryMatchupDanger === 'ROAM') {
      return ['lost-chapter', 'boots']
    }
  }

  if (profile.archetype === 'CRIT_MARKSMAN') {
    if (highPoke || context.primaryMatchupDanger === 'POKE') {
      return ['vampiric-scepter', 'boots']
    }

    if (highHealing) {
      return ['executioners-calling', 'boots']
    }

    if (highDive || highBurst || context.primaryMatchupDanger === 'ALL_IN') {
      return ['noonquiver', 'boots']
    }
  }

  if (profile.archetype === 'DIVER_BRUISER' || profile.archetype === 'POKE_FIGHTER') {
    if (highPoke || context.primaryMatchupDanger === 'POKE') {
      return ['vampiric-scepter', 'boots']
    }

    if (highHealing) {
      return ['executioners-calling', 'caulfields-warhammer']
    }

    if (heavyPhysical && (highBurst || context.primaryMatchupDanger === 'ALL_IN')) {
      return ['caulfields-warhammer', 'cloth-armor']
    }

    if (heavyMagic) {
      return ['caulfields-warhammer', 'null-magic-mantle']
    }
  }

  return profile.defaultFirstBuyItemIds
}

function pickCoreTemplate(profile: ChampionBuildProfile, context: BuildContext) {
  const severityScore: Record<BuildContext['activeThreats'][number]['severity'], number> = {
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  }

  const rankedTemplates = profile.coreTemplates.map((template, index) => {
    const score =
      template.preferredWhen?.reduce((total, trigger) => {
        const threat = getThreat(context, trigger)
        return total + (threat ? severityScore[threat.severity] : 0)
      }, 0) ?? 0

    return {
      template,
      score,
      index,
    }
  })

  rankedTemplates.sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score
    }

    return left.index - right.index
  })

  return rankedTemplates[0]?.template ?? profile.coreTemplates[0]
}

function buildCorePath(profile: ChampionBuildProfile, context: BuildContext) {
  const template = pickCoreTemplate(profile, context)

  return template.itemIds.map((itemId, index) =>
    buildStep(
      'CORE',
      index === 0 ? template.label : `Core follow-up ${index}`,
      [itemId],
      index === 0
        ? `${template.label} matches the current board better than a generic one-size-fits-all core.`
        : `${itemId} follows once the earlier checkpoint is secured and the draft plan stays intact.`,
      profile.source === 'CURATED' ? 'high' : 'medium',
    ),
  )
}

const branchLabels: Record<BuildTrigger, string> = {
  HEAVY_PHYSICAL: 'Armor branch',
  HEAVY_MAGIC: 'Magic resist branch',
  HIGH_DIVE: 'Anti-dive branch',
  HIGH_BURST: 'Anti-burst branch',
  HIGH_POKE: 'Anti-poke branch',
  HIGH_PICK: 'Anti-pick branch',
  HIGH_FRONTLINE: 'Anti-frontline branch',
  HIGH_HEALING: 'Anti-heal branch',
  HIGH_SHIELDING: 'Shield-breaking tempo branch',
  HIGH_CC: 'Anti-CC branch',
}

function buildSituationalBranches(profile: ChampionBuildProfile, context: BuildContext, coreItemIds: string[]) {
  const branches: SituationalBuildBranch[] = []

  for (const threat of context.activeThreats) {
    const response = profile.situationalResponses[threat.trigger]

    if (!response || response.length === 0) {
      continue
    }

    const uniqueItems = unique(response).filter((itemId) => !coreItemIds.includes(itemId))

    if (uniqueItems.length === 0) {
      continue
    }

    branches.push({
      id: `${profile.championId}-${threat.trigger}`,
      trigger: threat.trigger,
      severity: threat.severity,
      label: branchLabels[threat.trigger],
      conditionSummary: threat.summary,
      items: getItemReferences(uniqueItems),
      explanation: `${branchLabels[threat.trigger]} is active because ${threat.summary.toLowerCase()}`,
      tradeoff: 'Taking this branch usually delays the greediest raw-scaling option in exchange for making the current game more playable.',
    })
  }

  return branches
    .sort((left, right) => {
      const severityScore: Record<SituationalBuildBranch['severity'], number> = { HIGH: 3, MEDIUM: 2, LOW: 1 }
      return severityScore[right.severity] - severityScore[left.severity]
    })
    .slice(0, 4)
}

function buildAdjustments(context: BuildContext): BuildAdjustment[] {
  return context.activeThreats.slice(0, 4).map((threat) => ({
    trigger: threat.trigger,
    severity: threat.severity,
    summary: threat.summary,
  }))
}

function buildConfidence(profile: ChampionBuildProfile, branches: SituationalBuildBranch[]): ChampionBuildRecommendation['confidence'] {
  if (profile.source === 'CURATED' && branches.length >= 2) {
    return 'high'
  }

  if (profile.source === 'CURATED') {
    return 'medium'
  }

  return 'low'
}

export function recommendBuildForChampion({
  recommendation,
  scenario,
  champion,
  buildProfile,
}: {
  recommendation: RecommendationCandidate
  scenario: RecommendationScenario
  champion: Champion
  buildProfile: ChampionBuildProfile
}): ChampionBuildRecommendation {
  const context = buildBuildContext(scenario)
  const starterItemIds = pickStarterItemIds(buildProfile, context)
  const firstBuyItemIds = pickFirstBuyItemIds(buildProfile, context)
  const corePath = buildCorePath(buildProfile, context)
  const coreItemIds = corePath.flatMap((step) => step.items.map((item) => item.itemId))
  const situationalBranches = buildSituationalBranches(buildProfile, context, coreItemIds)
  const confidence = buildConfidence(buildProfile, situationalBranches)
  const starter = buildStep(
    'STARTER',
    'Starter setup',
    starterItemIds,
    'Open with a deterministic starter that fits the expected lane and first-contact pattern.',
    buildProfile.source === 'CURATED' ? 'high' : 'medium',
  )
  const firstBuy = buildStep(
    'FIRST_BUY',
    'First recall',
    firstBuyItemIds,
    'First-buy guidance is chosen to stabilize the most likely early punishment pattern before the full core comes online.',
    buildProfile.source === 'CURATED' ? 'high' : 'medium',
  )
  const buildWithoutExplanation: Omit<ChampionBuildRecommendation, 'explanation'> = {
    championId: champion.id,
    championName: champion.name,
    role: context.role,
    recommendationMode: recommendation.recommendationMode,
    patchVersion: scenario.simulatedDraftState.patchVersion,
    confidence,
    starter,
    firstBuy,
    corePath,
    situationalBranches,
    adjustments: buildAdjustments(context),
    dataQuality: {
      championProfileSource: buildProfile.source,
      notes: buildProfile.notes,
    },
  }

  return {
    ...buildWithoutExplanation,
    explanation: buildBuildExplanation({
      recommendation,
      build: buildWithoutExplanation,
      profile: buildProfile,
      context,
    }),
  }
}
