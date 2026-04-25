import type { CompositionArchetype, ExecutionDifficulty } from '@/domain/composition/types'
import type { Role } from '@/domain/champion/types'
import type {
  LanePhaseGuidance,
  MidGameGuidance,
  ObjectiveSetupGuidance,
  RoleMatchupDanger,
} from '@/domain/draft-context/types'

export interface LiveGamePlan {
  playerRole: Role
  playerChampionId?: string
  playerChampionName?: string
  playerJob: string
  allyIdentity: CompositionArchetype[]
  enemyIdentity: CompositionArchetype[]
  keyThreat: string
  easiestWinCondition: string
  practicalRules: string[]
  executionDifficulty: ExecutionDifficulty
  lanePhase?: LanePhaseGuidance
  midGame: MidGameGuidance
  objectives: ObjectiveSetupGuidance
  matchupDangers: RoleMatchupDanger[]
}
