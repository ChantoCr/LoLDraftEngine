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

export type TraitName =
  | 'engage'
  | 'disengage'
  | 'peel'
  | 'poke'
  | 'scaling'
  | 'dive'
  | 'pick'
  | 'frontline'

export interface TraitScoreMap {
  engage: number
  disengage: number
  peel: number
  poke: number
  scaling: number
  dive: number
  pick: number
  frontline: number
}

export type DamageProfileLeaning = 'AD_HEAVY' | 'AP_HEAVY' | 'BALANCED'
export type ExecutionDifficulty = 'LOW' | 'MEDIUM' | 'HIGH'
export type DraftAlertSeverity = 'info' | 'warning' | 'critical'

export interface DamageProfileSummary {
  physical: number
  magic: number
  mixed: number
  leaning: DamageProfileLeaning
}

export interface ArchetypeScore {
  archetype: CompositionArchetype
  score: number
}

export interface DraftAlert {
  id: string
  severity: DraftAlertSeverity
  title: string
  description: string
}

export interface CompositionProfile {
  championIds: string[]
  pickedCount: number
  traitTotals: TraitScoreMap
  averageTraits: TraitScoreMap
  damageProfile: DamageProfileSummary
  archetypeScores: ArchetypeScore[]
  archetypes: CompositionArchetype[]
  strengths: string[]
  weaknesses: string[]
  structuralGaps: string[]
  executionDifficulty: ExecutionDifficulty
  winConditions: string[]
  alerts: DraftAlert[]
}
