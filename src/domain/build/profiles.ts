import type { ChampionBuildProfile } from '@/domain/build/types'
import { buildProfiles15_8 } from '@/domain/build/data/patches/15.8'

export const CURATED_BUILD_PROFILES_BY_PATCH: Record<string, ChampionBuildProfile[]> = {
  '15.8': buildProfiles15_8,
}

export const curatedChampionBuildProfiles = CURATED_BUILD_PROFILES_BY_PATCH['15.8'] ?? []

export function normalizeBuildProfilePatchKey(patchVersion: string) {
  if (!patchVersion || patchVersion === 'latest') {
    return '15.8'
  }

  const [major, minor] = patchVersion.split('.')
  return major && minor ? `${major}.${minor}` : patchVersion
}

export function getCuratedBuildProfilesForPatch(patchVersion: string) {
  const normalizedPatchKey = normalizeBuildProfilePatchKey(patchVersion)
  return CURATED_BUILD_PROFILES_BY_PATCH[normalizedPatchKey] ?? curatedChampionBuildProfiles
}

export function getCuratedBuildProfileForPatch({
  patchVersion,
  championId,
  role,
}: {
  patchVersion: string
  championId: string
  role: ChampionBuildProfile['role']
}) {
  return getCuratedBuildProfilesForPatch(patchVersion).find(
    (profile) => profile.championId === championId && profile.role === role,
  )
}

export function buildCuratedBuildProfileCoverageReport({
  patchVersion,
  champions,
}: {
  patchVersion: string
  champions: Array<{ id: string; roles: ChampionBuildProfile['role'][] }>
}) {
  const profiles = getCuratedBuildProfilesForPatch(patchVersion)
  const curatedKeys = new Set(profiles.map((profile) => `${profile.championId}:${profile.role}`))
  const expectedKeys = champions.flatMap((champion) => champion.roles.map((role) => `${champion.id}:${role}`))
  const curatedCount = expectedKeys.filter((key) => curatedKeys.has(key)).length

  return {
    patchKey: normalizeBuildProfilePatchKey(patchVersion),
    curatedCount,
    expectedCount: expectedKeys.length,
    coverage: expectedKeys.length > 0 ? curatedCount / expectedKeys.length : 0,
  }
}
