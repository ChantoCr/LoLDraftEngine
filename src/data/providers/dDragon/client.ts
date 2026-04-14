import type { PatchVersion } from '@/domain/common/types'
import type { DDragonChampionCollectionResponse } from '@/data/providers/dDragon/types'

const DEFAULT_DDRAGON_BASE_URL = 'https://ddragon.leagueoflegends.com'

interface CreateDDragonClientInput {
  baseUrl?: string
  fetcher?: typeof fetch
}

interface FetchChampionCollectionInput {
  patchVersion: PatchVersion
  locale?: string
}

export interface DDragonClient {
  fetchVersions(): Promise<PatchVersion[]>
  fetchChampionCollection(input: FetchChampionCollectionInput): Promise<DDragonChampionCollectionResponse>
}

export function buildDDragonVersionsUrl(baseUrl = DEFAULT_DDRAGON_BASE_URL) {
  return `${baseUrl}/api/versions.json`
}

export function buildDDragonChampionCollectionUrl(
  patchVersion: PatchVersion,
  locale = 'en_US',
  baseUrl = DEFAULT_DDRAGON_BASE_URL,
) {
  return `${baseUrl}/cdn/${patchVersion}/data/${locale}/champion.json`
}

async function fetchJson<TResponse>(fetcher: typeof fetch, url: string) {
  const response = await fetcher(url)

  if (!response.ok) {
    throw new Error(`DDragon request failed: ${response.status} ${response.statusText}`)
  }

  return (await response.json()) as TResponse
}

export function createDDragonClient({
  baseUrl = DEFAULT_DDRAGON_BASE_URL,
  fetcher = fetch,
}: CreateDDragonClientInput = {}): DDragonClient {
  return {
    fetchVersions() {
      return fetchJson<PatchVersion[]>(fetcher, buildDDragonVersionsUrl(baseUrl))
    },
    fetchChampionCollection({ patchVersion, locale = 'en_US' }) {
      return fetchJson<DDragonChampionCollectionResponse>(
        fetcher,
        buildDDragonChampionCollectionUrl(patchVersion, locale, baseUrl),
      )
    },
  }
}
