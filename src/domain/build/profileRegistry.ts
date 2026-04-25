import type { ChampionBuildProfileRegistry } from '@/domain/build/types'
import { getCuratedBuildProfileForPatch } from '@/domain/build/profiles'
import { scaffoldChampionBuildProfile } from '@/domain/build/scaffold'

export const defaultChampionBuildProfileRegistry: ChampionBuildProfileRegistry = {
  getProfile({ championId, role, patchVersion, champion }) {
    return getCuratedBuildProfileForPatch({ patchVersion, championId, role }) ?? scaffoldChampionBuildProfile(champion, role)
  },
}
