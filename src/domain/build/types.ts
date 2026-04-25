import type { Champion, Role } from '@/domain/champion/types'
import type { ConfidenceLevel, PatchVersion } from '@/domain/common/types'
import type {
  GuidanceSeverity,
  LanePosture,
  MatchupDangerType,
  MidGamePosture,
  ObjectiveSetupStyle,
} from '@/domain/draft-context/types'
import type { RecommendationMode } from '@/domain/draft/types'

export type BuildPhase = 'STARTER' | 'FIRST_BUY' | 'CORE'

export type BuildTrigger =
  | 'HEAVY_PHYSICAL'
  | 'HEAVY_MAGIC'
  | 'HIGH_DIVE'
  | 'HIGH_BURST'
  | 'HIGH_POKE'
  | 'HIGH_PICK'
  | 'HIGH_FRONTLINE'
  | 'HIGH_HEALING'
  | 'HIGH_SHIELDING'
  | 'HIGH_CC'

export type BuildArchetype =
  | 'ENGAGE_TANK_SUPPORT'
  | 'PEEL_TANK_SUPPORT'
  | 'ENCHANTER_UTILITY'
  | 'CONTROL_MAGE'
  | 'DIVER_BRUISER'
  | 'CRIT_MARKSMAN'
  | 'POKE_FIGHTER'
  | 'TANK_JUNGLER'

export interface ItemReference {
  itemId: string
  itemName: string
  tags: string[]
}

export interface BuildStep {
  phase: BuildPhase
  label: string
  items: ItemReference[]
  explanation: string
  confidence: ConfidenceLevel
}

export interface SituationalBuildBranch {
  id: string
  trigger: BuildTrigger
  severity: GuidanceSeverity
  label: string
  conditionSummary: string
  items: ItemReference[]
  explanation: string
  tradeoff?: string
}

export interface BuildAdjustment {
  trigger: BuildTrigger
  severity: GuidanceSeverity
  summary: string
}

export interface BuildExplanation {
  headline: string
  summary: string
  bullets: string[]
}

export interface ChampionBuildRecommendation {
  championId: string
  championName: string
  role: Role
  recommendationMode: RecommendationMode
  patchVersion: PatchVersion
  confidence: ConfidenceLevel
  starter?: BuildStep
  firstBuy?: BuildStep
  corePath: BuildStep[]
  situationalBranches: SituationalBuildBranch[]
  adjustments: BuildAdjustment[]
  explanation: BuildExplanation
  dataQuality: {
    championProfileSource: 'CURATED' | 'SCAFFOLDED'
    notes: string[]
  }
}

export interface ChampionBuildProfile {
  championId: string
  role: Role
  source: 'CURATED' | 'SCAFFOLDED'
  archetype: BuildArchetype
  defaultStarterItemIds: string[]
  defaultFirstBuyItemIds: string[]
  coreTemplates: Array<{
    id: string
    label: string
    itemIds: string[]
    preferredWhen?: BuildTrigger[]
  }>
  situationalResponses: Partial<Record<BuildTrigger, string[]>>
  notes: string[]
}

export interface BuildContext {
  role: Role
  lanePosture?: LanePosture
  primaryMatchupDanger?: MatchupDangerType
  objectiveCall: ObjectiveSetupStyle
  midGamePosture: MidGamePosture
  activeThreats: Array<{
    trigger: BuildTrigger
    severity: GuidanceSeverity
    summary: string
  }>
}

export interface ChampionBuildProfileRegistry {
  getProfile(input: {
    championId: string
    role: Role
    patchVersion: PatchVersion
    champion: Champion
  }): ChampionBuildProfile
}
