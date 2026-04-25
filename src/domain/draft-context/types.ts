import type { Role } from '@/domain/champion/types'
import type { CompositionProfile } from '@/domain/composition/types'
import type { DraftQueueContext } from '@/domain/draft/queue'
import type { ProductMode } from '@/domain/draft/types'

export type GuidanceSeverity = 'LOW' | 'MEDIUM' | 'HIGH'

export type LanePosture =
  | 'PRESS_PRIORITY'
  | 'STABILIZE'
  | 'SHORT_TRADE'
  | 'ALL_IN_WINDOW'
  | 'PLAY_FOR_ROAM'
  | 'PROTECT_WAVE'

export type MidGamePosture =
  | 'GROUP_AND_FORCE'
  | 'PROTECT_AND_FRONT_TO_BACK'
  | 'PICK_AND_RESET'
  | 'STALL_AND_SCALE'
  | 'SIDE_AND_COLLAPSE'

export type ObjectiveSetupStyle =
  | 'ARRIVE_FIRST'
  | 'START_ON_SPAWN'
  | 'TURN_ON_ENTRY'
  | 'CONTROL_CHOKES'
  | 'TRADE_CROSSMAP'
  | 'AVOID_BLIND_ENTRY'

export type MatchupDangerType = 'ALL_IN' | 'POKE' | 'ROAM' | 'DIVE' | 'PICK' | 'PRIORITY_LOSS'

export interface GuidanceBullet {
  id: string
  label: string
  explanation: string
  priority: GuidanceSeverity
  sources: string[]
}

export interface RoleMatchupDanger {
  role: Role
  allyChampionId?: string
  enemyChampionId?: string
  type: MatchupDangerType
  severity: GuidanceSeverity
  summary: string
  explanation: string
  mitigation: string
}

export interface LanePhaseGuidance {
  role: Role
  posture: LanePosture
  summary: string
  priorities: GuidanceBullet[]
  avoid: GuidanceBullet[]
  linkedDangers: RoleMatchupDanger[]
}

export interface MidGameGuidance {
  posture: MidGamePosture
  summary: string
  priorities: GuidanceBullet[]
  avoid: GuidanceBullet[]
}

export interface ObjectiveSetupGuidance {
  primaryCall: ObjectiveSetupStyle
  summary: string
  dragon: GuidanceBullet[]
  herald: GuidanceBullet[]
  baron: GuidanceBullet[]
  commonRisks: GuidanceBullet[]
}

export type ThreatSignalType =
  | 'PHYSICAL_DAMAGE'
  | 'MAGIC_DAMAGE'
  | 'BURST'
  | 'SUSTAINED_DPS'
  | 'DIVE'
  | 'POKE'
  | 'PICK'
  | 'FRONTLINE'
  | 'HEALING'
  | 'SHIELDING'
  | 'CROWD_CONTROL'

export interface ThreatSignal {
  type: ThreatSignalType
  severity: GuidanceSeverity
  summary: string
  sources: string[]
}

export interface EnemyThreatProfile {
  signals: ThreatSignal[]
  physicalPressure: number
  magicPressure: number
  burstPressure: number
  sustainedDpsPressure: number
  divePressure: number
  pokePressure: number
  pickPressure: number
  frontlineDensity: number
  healingPressure: number
  shieldingPressure: number
  crowdControlDensity: number
}

export interface DraftContext {
  queueContext?: DraftQueueContext
  productMode: ProductMode
  allyProfile: CompositionProfile
  enemyProfile: CompositionProfile
  lanePhaseByRole: Partial<Record<Role, LanePhaseGuidance>>
  matchupDangers: RoleMatchupDanger[]
  enemyThreatProfile: EnemyThreatProfile
  midGame: MidGameGuidance
  objectives: ObjectiveSetupGuidance
}
