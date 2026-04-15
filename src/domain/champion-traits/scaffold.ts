import type { Champion, ChampionClass, ChampionTraits, Role } from '@/domain/champion/types'
import { clamp, roundTo, unique } from '@/domain/common/math'
import type { ChampionRecord, ChampionRolePerformance, PatchDataBundle } from '@/domain/stats/types'
import type { ChampionTraitScaffoldEntry } from '@/domain/champion-traits/types'

const CLASS_TRAIT_TEMPLATES: Record<ChampionClass, Omit<ChampionTraits, 'damageProfile'>> = {
  TANK: { engage: 3.8, disengage: 2.6, peel: 3.3, poke: 0.8, scaling: 2.1, dive: 2.7, pick: 2.4, frontline: 4.6 },
  FIGHTER: { engage: 2.6, disengage: 1.1, peel: 1.2, poke: 1.4, scaling: 2.5, dive: 3.4, pick: 2, frontline: 2.9 },
  MAGE: { engage: 1.5, disengage: 1.9, peel: 1.7, poke: 3.6, scaling: 3.4, dive: 1, pick: 2.1, frontline: 0.5 },
  ASSASSIN: { engage: 1.9, disengage: 1.1, peel: 0.4, poke: 1.2, scaling: 2, dive: 4.4, pick: 3.6, frontline: 0.2 },
  MARKSMAN: { engage: 0.4, disengage: 1.4, peel: 0.6, poke: 2.4, scaling: 4.2, dive: 0.4, pick: 1.1, frontline: 0.1 },
  ENCHANTER: { engage: 1.3, disengage: 3.4, peel: 4, poke: 1.6, scaling: 2.8, dive: 0.5, pick: 1.4, frontline: 0.4 },
  CATCHER: { engage: 3.4, disengage: 2.2, peel: 2.3, poke: 1.2, scaling: 1.9, dive: 1.7, pick: 4.2, frontline: 1.5 },
}

function averageRolePickRate(rolePerformance: ChampionRolePerformance | undefined) {
  return rolePerformance?.pickRate ?? 0
}

function inferRolesFromPerformances(rolePerformances: ChampionRolePerformance[]) {
  return [...rolePerformances]
    .sort((left, right) => averageRolePickRate(right) - averageRolePickRate(left))
    .filter((entry) => (entry.pickRate ?? 0) > 0.01)
    .map((entry) => entry.role)
    .slice(0, 2)
}

function inferRolesFromClasses(classes: ChampionClass[]) {
  const inferredRoles: Role[] = []

  if (classes.includes('ENCHANTER') || classes.includes('CATCHER')) {
    inferredRoles.push('SUPPORT')
  }

  if (classes.includes('MARKSMAN')) {
    inferredRoles.push('ADC')
  }

  if (classes.includes('ASSASSIN') || classes.includes('MAGE')) {
    inferredRoles.push('MID')
  }

  if (classes.includes('FIGHTER') || classes.includes('TANK')) {
    inferredRoles.push('TOP', 'JUNGLE')
  }

  return unique(inferredRoles).slice(0, 3)
}

function inferDamageProfile(classes: ChampionClass[]): ChampionTraits['damageProfile'] {
  if (classes.includes('MARKSMAN') || classes.includes('ASSASSIN') || classes.includes('FIGHTER')) {
    if (classes.includes('MAGE') || classes.includes('ENCHANTER')) {
      return 'MIXED'
    }

    return 'PHYSICAL'
  }

  return classes.includes('MAGE') || classes.includes('ENCHANTER') || classes.includes('CATCHER')
    ? 'MAGIC'
    : 'MIXED'
}

function inferConfidence(rolePerformances: ChampionRolePerformance[]) {
  const topConfidence = rolePerformances.sort((left, right) => right.confidence.score - left.confidence.score)[0]

  if (topConfidence && topConfidence.confidence.level !== 'low') {
    return topConfidence.confidence.level
  }

  return 'medium'
}

function buildRationale(champion: ChampionRecord, inferredRoles: Role[]) {
  const rationale = [`Classes: ${champion.classes.join(', ') || 'unknown'}`]

  if (inferredRoles.length > 0) {
    rationale.push(`Inferred roles: ${inferredRoles.join(', ')}`)
  }

  rationale.push('Trait values are scaffolded from champion classes, kit ratings, and any available role performance signals.')
  return rationale
}

function mergeClassTemplates(classes: ChampionClass[], difficulty: number): Omit<ChampionTraits, 'damageProfile'> {
  const baseClasses: ChampionClass[] = classes.length > 0 ? classes : ['FIGHTER']
  const total = baseClasses.reduce<Omit<ChampionTraits, 'damageProfile'>>(
    (accumulator, championClass) => {
      const template = CLASS_TRAIT_TEMPLATES[championClass]

      return {
        engage: accumulator.engage + template.engage,
        disengage: accumulator.disengage + template.disengage,
        peel: accumulator.peel + template.peel,
        poke: accumulator.poke + template.poke,
        scaling: accumulator.scaling + template.scaling,
        dive: accumulator.dive + template.dive,
        pick: accumulator.pick + template.pick,
        frontline: accumulator.frontline + template.frontline,
      }
    },
    { engage: 0, disengage: 0, peel: 0, poke: 0, scaling: 0, dive: 0, pick: 0, frontline: 0 },
  )

  const count = baseClasses.length
  const difficultyAdjustment = difficulty >= 7 ? 0.4 : difficulty >= 4 ? 0.2 : 0

  return {
    engage: clamp(roundTo(total.engage / count + difficultyAdjustment, 1), 0, 5),
    disengage: clamp(roundTo(total.disengage / count, 1), 0, 5),
    peel: clamp(roundTo(total.peel / count, 1), 0, 5),
    poke: clamp(roundTo(total.poke / count, 1), 0, 5),
    scaling: clamp(roundTo(total.scaling / count, 1), 0, 5),
    dive: clamp(roundTo(total.dive / count + difficultyAdjustment, 1), 0, 5),
    pick: clamp(roundTo(total.pick / count, 1), 0, 5),
    frontline: clamp(roundTo(total.frontline / count, 1), 0, 5),
  }
}

export function buildChampionTraitScaffoldEntry(champion: ChampionRecord): ChampionTraitScaffoldEntry {
  const inferredRoles = unique([
    ...inferRolesFromPerformances(champion.rolePerformances),
    ...inferRolesFromClasses(champion.classes),
  ])
  const coreTraits = mergeClassTemplates(champion.classes, champion.kitRatings.difficulty)
  const championRecord: Champion = {
    id: champion.id,
    name: champion.name,
    roles: inferredRoles,
    classes: champion.classes,
    traits: {
      ...coreTraits,
      damageProfile: inferDamageProfile(champion.classes),
    },
  }

  return {
    championId: champion.id,
    championName: champion.name,
    patchVersion: champion.patchVersion,
    inferredRoles,
    inferredClasses: champion.classes,
    confidence: inferConfidence(champion.rolePerformances),
    rationale: buildRationale(champion, inferredRoles),
    champion: championRecord,
  }
}

export function buildChampionTraitScaffoldDataset(bundle: PatchDataBundle) {
  return bundle.champions.map((champion) => buildChampionTraitScaffoldEntry(champion))
}

export function buildChampionMapFromScaffoldDataset(
  bundle: PatchDataBundle,
  overrides: Record<string, Champion> = {},
) {
  return buildChampionTraitScaffoldDataset(bundle).reduce<Record<string, Champion>>((accumulator, entry) => {
    accumulator[entry.championId] = overrides[entry.championId] ?? entry.champion
    return accumulator
  }, { ...overrides })
}
