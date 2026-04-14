import type { PatchVersion } from '@/domain/common/types'
import type { ExternalPatchStatsPayload } from '@/data/providers/external/types'

export interface LoadExternalPatchStatsInput {
  patchVersion: PatchVersion
}

export interface ExternalStatsAdapter {
  listAvailablePatchVersions(): Promise<PatchVersion[]>
  loadPatchStats(input: LoadExternalPatchStatsInput): Promise<ExternalPatchStatsPayload>
}

export function createStaticExternalStatsAdapter(
  payloadsByPatchVersion: Record<PatchVersion, ExternalPatchStatsPayload>,
): ExternalStatsAdapter {
  return {
    async listAvailablePatchVersions() {
      return Object.keys(payloadsByPatchVersion).sort((left, right) => right.localeCompare(left))
    },
    async loadPatchStats({ patchVersion }) {
      const payload = payloadsByPatchVersion[patchVersion]

      if (!payload) {
        throw new Error(`No external stats fixture found for patch ${patchVersion}`)
      }

      return payload
    },
  }
}
