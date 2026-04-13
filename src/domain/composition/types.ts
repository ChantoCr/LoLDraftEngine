export type CompositionArchetype =
  | 'ENGAGE'
  | 'DISENGAGE'
  | 'PEEL'
  | 'POKE'
  | 'SCALING'
  | 'DIVE'
  | 'PICK'
  | 'FRONT_TO_BACK'
  | 'HYBRID'

export type ExecutionDifficulty = 'LOW' | 'MEDIUM' | 'HIGH'
export type DraftAlertSeverity = 'info' | 'warning' | 'critical'

export interface DraftAlert {
  id: string
  severity: DraftAlertSeverity
  title: string
  description: string
}

export interface CompositionProfile {
  archetypes: CompositionArchetype[]
  strengths: string[]
  weaknesses: string[]
  structuralGaps: string[]
  executionDifficulty: ExecutionDifficulty
  winConditions: string[]
  alerts: DraftAlert[]
}
