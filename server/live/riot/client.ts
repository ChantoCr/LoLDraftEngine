import type { RiotLookupDebugInfo, RiotLookupStepDebugInfo, RiotRegion } from '@/domain/live/types'
import { getRiotRegionRouting } from '@server/live/riot/routing'

interface RiotAccountDto {
  puuid: string
  gameName: string
  tagLine: string
}

interface RiotSummonerDto {
  puuid: string
  profileIconId: number
  revisionDate?: number
  summonerLevel: number
}

interface RiotCurrentGameParticipantDto {
  teamId: number
  championId: number
  spell1Id?: number
  spell2Id?: number
  puuid?: string
  summonerId?: string
  summonerName?: string
  riotIdGameName?: string
  riotIdTagline?: string
}

interface RiotCurrentGameBannedChampionDto {
  championId: number
  teamId: number
}

interface RiotCurrentGameInfoDto {
  gameId: number
  gameMode: string
  gameType: string
  participants: RiotCurrentGameParticipantDto[]
  bannedChampions?: RiotCurrentGameBannedChampionDto[]
}

interface CreateRiotApiClientInput {
  apiKey: string
  fetcher?: typeof fetch
}

class RiotApiRequestError extends Error {
  status: number
  statusText: string

  constructor(message: string, { status, statusText }: { status: number; statusText: string }) {
    super(message)
    this.name = 'RiotApiRequestError'
    this.status = status
    this.statusText = statusText
  }
}

class RiotLookupError extends Error {
  lookupDebug: RiotLookupDebugInfo

  constructor(message: string, lookupDebug: RiotLookupDebugInfo) {
    super(message)
    this.name = 'RiotLookupError'
    this.lookupDebug = lookupDebug
  }
}

export interface RiotRecognizedPlayer {
  account: RiotAccountDto
  summoner: RiotSummonerDto
  activeGame?: RiotCurrentGameInfoDto | null
  activeGameWarning?: string
  region: RiotRegion
  lookupDebug: RiotLookupDebugInfo
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

function buildActiveGameUrl(puuid: string, region: RiotRegion) {
  const routing = getRiotRegionRouting(region)
  return `https://${routing.platformId}.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${encodeURIComponent(puuid)}`
}

async function readRiotErrorMessage(response: Response, fallbackMessage: string) {
  const bodyText = (await response.text()).trim()

  if (!bodyText) {
    return fallbackMessage
  }

  try {
    const payload = JSON.parse(bodyText) as Record<string, unknown>
    const statusPayload =
      payload.status && typeof payload.status === 'object' ? (payload.status as Record<string, unknown>) : undefined
    const riotMessage =
      typeof statusPayload?.message === 'string'
        ? statusPayload.message
        : typeof payload.message === 'string'
          ? payload.message
          : undefined

    return riotMessage ? `${fallbackMessage} - ${riotMessage}` : `${fallbackMessage} - ${bodyText}`
  } catch {
    return `${fallbackMessage} - ${bodyText}`
  }
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
    throw new RiotApiRequestError(await readRiotErrorMessage(response, `Riot API request failed: ${response.status} ${response.statusText}`), {
      status: response.status,
      statusText: response.statusText,
    })
  }

  return (await response.json()) as TResponse
}

function cloneLookupDebug(lookupDebug: RiotLookupDebugInfo): RiotLookupDebugInfo {
  return {
    source: lookupDebug.source,
    accountLookup: { ...lookupDebug.accountLookup },
    summonerLookupByPuuid: { ...lookupDebug.summonerLookupByPuuid },
    spectatorLookupPath: { ...lookupDebug.spectatorLookupPath },
    activeGameLookup: { ...lookupDebug.activeGameLookup },
  }
}

function buildFriendlyRiotLookupFailureMessage(error: unknown) {
  if (error instanceof RiotApiRequestError) {
    if (error.status === 401 && error.message.toLowerCase().includes('unknown apikey')) {
      return 'RIOT_API_KEY is invalid or expired. Generate a fresh Riot Developer Portal key, set it in `.env.local` as `RIOT_API_KEY=...`, restart `npm run server:dev`, and retry. The backend reads `.env` and `.env.local`, not `.env.example`. If you already updated `.env.local`, check whether a stale shell/system `RIOT_API_KEY` is overriding it.'
    }

    if (error.status === 401) {
      return 'Riot rejected the API key with 401 Unauthorized. Generate a fresh Riot Developer Portal key, set it in `.env.local`, restart the backend, and retry.'
    }

    if (error.status === 429) {
      return 'Riot rate limits were hit for this API key. Wait briefly, then retry the request.'
    }
  }

  return error instanceof Error ? error.message : String(error)
}

function withLookupContext(stepLabel: string, error: unknown, lookupDebug: RiotLookupDebugInfo) {
  return new RiotLookupError(`${stepLabel}: ${buildFriendlyRiotLookupFailureMessage(error)}`, cloneLookupDebug(lookupDebug))
}

function createInitialLookupDebug(): RiotLookupDebugInfo {
  const initialStep = (): RiotLookupStepDebugInfo => ({ status: 'skipped' })

  return {
    source: 'RIOT_API',
    accountLookup: initialStep(),
    summonerLookupByPuuid: initialStep(),
    spectatorLookupPath: initialStep(),
    activeGameLookup: initialStep(),
  }
}

function markSpectatorLookupAsPuuidBased(lookupDebug: RiotLookupDebugInfo) {
  lookupDebug.spectatorLookupPath = {
    status: 'success',
    details: 'Using the docs-aligned spectator-v5 active-game lookup path with the player PUUID directly.',
  }
}

export function createRiotApiClient({ apiKey, fetcher = fetch }: CreateRiotApiClientInput): RiotApiClient {
  return {
    async recognizePlayerByRiotId({ gameName, tagLine, region }) {
      const lookupDebug = createInitialLookupDebug()
      let account: RiotAccountDto | null

      try {
        account = await fetchRiotJson<RiotAccountDto | null>(
          fetcher,
          buildAccountByRiotIdUrl(gameName, tagLine, region),
          apiKey,
        )
      } catch (error) {
        lookupDebug.accountLookup = {
          status: 'failed',
          details: buildFriendlyRiotLookupFailureMessage(error),
        }
        throw withLookupContext('Riot account lookup failed', error, lookupDebug)
      }

      if (!account) {
        lookupDebug.accountLookup = {
          status: 'not-found',
          details: `No Riot account was found for ${gameName}#${tagLine} in ${region}.`,
        }
        throw new Error(`No Riot account was found for ${gameName}#${tagLine} in ${region}.`)
      }

      lookupDebug.accountLookup = {
        status: 'success',
        details: `Resolved Riot account for ${account.gameName}#${account.tagLine}.`,
      }

      let summoner: RiotSummonerDto | null

      try {
        summoner = await fetchRiotJson<RiotSummonerDto | null>(
          fetcher,
          buildSummonerByPuuidUrl(account.puuid, region),
          apiKey,
        )
      } catch (error) {
        lookupDebug.summonerLookupByPuuid = {
          status: 'failed',
          details: buildFriendlyRiotLookupFailureMessage(error),
        }
        throw withLookupContext('Riot summoner profile lookup failed', error, lookupDebug)
      }

      if (!summoner) {
        lookupDebug.summonerLookupByPuuid = {
          status: 'not-found',
          details: `No summoner profile was found for ${gameName}#${tagLine} in ${region}.`,
        }
        throw new Error(`No summoner profile was found for ${gameName}#${tagLine} in ${region}.`)
      }

      lookupDebug.summonerLookupByPuuid = {
        status: 'success',
        details: 'PUUID-based summoner lookup returned the current SummonerDTO fields documented by Riot (profile icon, revision date, puuid, summoner level).',
      }

      let activeGame: RiotCurrentGameInfoDto | null = null
      let activeGameWarning: string | undefined

      markSpectatorLookupAsPuuidBased(lookupDebug)

      try {
        activeGame = await fetchRiotJson<RiotCurrentGameInfoDto | null>(
          fetcher,
          buildActiveGameUrl(account.puuid, region),
          apiKey,
        )
        lookupDebug.activeGameLookup = activeGame
          ? {
              status: 'success',
              details: `Active game ${activeGame.gameMode}/${activeGame.gameType} was returned by Riot spectator APIs using the player PUUID.`,
            }
          : {
              status: 'not-found',
              details: 'No active spectatable game was returned for this player.',
            }
      } catch (error) {
        const message = buildFriendlyRiotLookupFailureMessage(error)

        if (error instanceof RiotApiRequestError && error.status === 403) {
          lookupDebug.activeGameLookup = {
            status: 'forbidden',
            details: message,
          }
          activeGameWarning =
            'Riot spectator-v5 active-game lookup returned 403 Forbidden for this player/session. Recognition still succeeded, but spectator roster access is unavailable here.'
        } else {
          lookupDebug.activeGameLookup = {
            status: 'unavailable',
            details: message,
          }
          activeGameWarning =
            'Riot spectator-v5 active-game lookup is currently unavailable. Recognition still succeeded, but no live roster could be fetched right now.'
        }
      }

      return {
        account,
        summoner,
        activeGame,
        activeGameWarning,
        region,
        lookupDebug,
      }
    },
  }
}
