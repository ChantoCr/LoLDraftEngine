import type { PatchVersion } from '@/domain/common/types'
import type { PatchDataBundle } from '@/domain/stats/types'

export interface LoadPatchDataBundleInput {
  patchVersion: PatchVersion
  locale?: string
}

export interface StatsProvider {
  listAvailablePatchVersions(): Promise<PatchVersion[]>
  loadPatchDataBundle(input: LoadPatchDataBundleInput): Promise<PatchDataBundle>
}
