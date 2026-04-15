import type { RiotRegion } from '@/domain/live/types'
import { getRiotRegionRouting } from '@server/live/riot/routing'

interface RiotAccountDto {
  puuid: string
  gameName: string
  tagLine: string
}

interface RiotSummonerDto {
  id: string
  puuid: string
  gameName?: string
  profileIconId: number
  summonerLevel: number
}

interface RiotCurrentGameInfoDto {
  gameId: number
  gameMode: string
  gameType: string
}

interface CreateRiotApiClientInput {
  apiKey: string
  fetcher?: typeof fetch
}

export interface RiotRecognizedPlayer {
  account: RiotAccountDto
  summoner: RiotSummonerDto
  activeGame?: RiotCurrentGameInfoDto | null
  region: RiotRegion
}

export interface RiotApiClient {
  recognizePlayerByRiotId(input: {
    gameName: string
    tagLine: string
    region: RiotRegion
  }): Promise<RiotRecognizedPlayer>
}

function buildAccountByRiotIdUrl(gameName: string, tagLine: string, region: RiotRegion) {
  const routing = getRiotRegionRouting(region)
  return `https://${routing.regionalCluster}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`
}

function buildSummonerByPuuidUrl(puuid: string, region: RiotRegion) {
  const routing = getRiotRegionRouting(region)
  return `https://${routing.platformId}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(puuid)}`
}

function buildActiveGameUrl(encryptedSummonerId: string, region: RiotRegion) {
  const routing = getRiotRegionRouting(region)
  return `https://${routing.platformId}.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${encodeURIComponent(encryptedSummonerId)}`
}

async function fetchRiotJson<TResponse>(fetcher: typeof fetch, url: string, apiKey: string) {
  const response = await fetcher(url, {
    headers: {
      'X-Riot-Token': apiKey,
    },
  })

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(`Riot API request failed: ${response.status} ${response.statusText}`)
  }

  return (await response.json()) as TResponse
}

export function createRiotApiClient({ apiKey, fetcher = fetch }: CreateRiotApiClientInput): RiotApiClient {
  return {
    async recognizePlayerByRiotId({ gameName, tagLine, region }) {
      const account = await fetchRiotJson<RiotAccountDto | null>(
        fetcher,
        buildAccountByRiotIdUrl(gameName, tagLine, region),
        apiKey,
      )

      if (!account) {
        throw new Error(`No Riot account was found for ${gameName}#${tagLine} in ${region}.`)
      }

      const summoner = await fetchRiotJson<RiotSummonerDto | null>(
        fetcher,
        buildSummonerByPuuidUrl(account.puuid, region),
        apiKey,
      )

      if (!summoner) {
        throw new Error(`No summoner profile was found for ${gameName}#${tagLine} in ${region}.`)
      }

      const activeGame = await fetchRiotJson<RiotCurrentGameInfoDto | null>(
        fetcher,
        buildActiveGameUrl(summoner.id, region),
        apiKey,
      )

      return {
        account,
        summoner,
        activeGame,
        region,
      }
    },
  }
}
