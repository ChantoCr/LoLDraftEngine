import type { CompositionArchetype, TraitName } from '@/domain/composition/types'

export const TRAIT_KEYS: TraitName[] = [
  'engage',
  'disengage',
  'peel',
  'poke',
  'scaling',
  'dive',
  'pick',
  'frontline',
]

export const ARCHETYPE_SCORING_WEIGHTS: Record<
  Exclude<CompositionArchetype, 'HYBRID'>,
  Partial<Record<TraitName, number>>
> = {
  ENGAGE: {
    engage: 1,
    pick: 0.25,
    frontline: 0.2,
  },
  DISENGAGE: {
    disengage: 1,
    peel: 0.35,
  },
  PEEL: {
    peel: 1,
    disengage: 0.35,
    frontline: 0.2,
  },
  POKE: {
    poke: 1,
    pick: 0.15,
  },
  SCALING: {
    scaling: 1,
  },
  DIVE: {
    dive: 0.8,
    engage: 0.35,
    peel: -0.1,
  },
  PICK: {
    pick: 1,
    engage: 0.2,
  },
  FRONT_TO_BACK: {
    frontline: 0.8,
    peel: 0.55,
    scaling: 0.45,
  },
}

export const COMPOSITION_THRESHOLDS = {
  strongArchetype: 2.6,
  secondaryArchetype: 2.25,
  lowFrontline: 1.8,
  lowEngage: 1.8,
  lowPeel: 1.9,
  lowScaling: 2.1,
  enemyDivePressure: 2.2,
  enemyPickPressure: 2.3,
  enemyPokePressure: 2.3,
}
