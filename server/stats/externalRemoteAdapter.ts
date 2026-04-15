import type { PatchVersion } from '@/domain/common/types'
import type { ExternalStatsAdapter, LoadExternalPatchStatsInput } from '@/data/providers/external/adapter'
import type { ExternalPatchStatsPayload } from '@/data/providers/external/types'

interface CreateRemoteExternalStatsAdapterInput {
  baseUrl: string
  fetcher?: typeof fetch
}

export function createRemoteExternalStatsAdapter({
  baseUrl,
  fetcher = fetch,
}: CreateRemoteExternalStatsAdapterInput): ExternalStatsAdapter {
  return {
    async listAvailablePatchVersions() {
      const response = await fetcher(`${baseUrl.replace(/\/$/, '')}/patches`)

      if (!response.ok) {
        throw new Error(`External stats patch listing failed: ${response.status} ${response.statusText}`)
      }

      return (await response.json()) as PatchVersion[]
    },
    async loadPatchStats({ patchVersion }: LoadExternalPatchStatsInput): Promise<ExternalPatchStatsPayload> {
      const response = await fetcher(`${baseUrl.replace(/\/$/, '')}/patch/${encodeURIComponent(patchVersion)}`)

      if (!response.ok) {
        throw new Error(`External stats patch load failed: ${response.status} ${response.statusText}`)
      }

      return (await response.json()) as ExternalPatchStatsPayload
    },
  }
}
