import type { RiotLookupDebugInfo, RiotLookupStepDebugInfo, RiotRegion } from '@/domain/live/types'
import { getRiotRegionRouting } from '@server/live/riot/routing'

interface RiotAccountDto {
  puuid: string
  gameName: string
  tagLine: string
}

interface RiotSummonerDto {
  id?: string
  puuid: string
  gameName?: string
  profileIconId: number
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

function buildSummonerByNameUrl(summonerName: string, region: RiotRegion) {
  const routing = getRiotRegionRouting(region)
  return `https://${routing.platformId}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(summonerName)}`
}

function buildActiveGameUrl(encryptedSummonerId: string, region: RiotRegion) {
  const routing = getRiotRegionRouting(region)
  return `https://${routing.platformId}.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${encodeURIComponent(encryptedSummonerId)}`
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
    throw new Error(await readRiotErrorMessage(response, `Riot API request failed: ${response.status} ${response.statusText}`))
  }

  return (await response.json()) as TResponse
}

function withLookupContext(stepLabel: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  return new Error(`${stepLabel}: ${message}`)
}

function createInitialLookupDebug(): RiotLookupDebugInfo {
  const initialStep = (): RiotLookupStepDebugInfo => ({ status: 'skipped' })

  return {
    source: 'RIOT_API',
    accountLookup: initialStep(),
    summonerLookupByPuuid: initialStep(),
    summonerLookupByNameFallback: { status: 'not-needed' },
    encryptedSummonerId: initialStep(),
    activeGameLookup: initialStep(),
  }
}

async function resolveEncryptedSummonerId({
  fetcher,
  apiKey,
  region,
  account,
  summoner,
  lookupDebug,
}: {
  fetcher: typeof fetch
  apiKey: string
  region: RiotRegion
  account: RiotAccountDto
  summoner: RiotSummonerDto
  lookupDebug: RiotLookupDebugInfo
}) {
  if (summoner.id) {
    lookupDebug.summonerLookupByNameFallback = { status: 'not-needed' }
    lookupDebug.encryptedSummonerId = {
      status: 'success',
      details: 'Encrypted summoner id was returned directly from the PUUID-based summoner lookup.',
    }

    return {
      encryptedSummonerId: summoner.id,
      summoner,
    }
  }

  const fallbackSummonerNames = [...new Set([summoner.gameName, account.gameName].filter(Boolean) as string[])]

  if (fallbackSummonerNames.length === 0) {
    lookupDebug.summonerLookupByNameFallback = {
      status: 'skipped',
      details: 'No fallback summoner name was available for a secondary lookup.',
    }
    lookupDebug.encryptedSummonerId = {
      status: 'failed',
      details: 'No encrypted summoner id was available after the primary summoner lookup.',
    }

    return {
      encryptedSummonerId: undefined,
      summoner,
      warning:
        'Riot recognized the player profile, but did not return an encrypted summoner id for spectator lookup and no fallback summoner name was available. Active-game detection was skipped.',
    }
  }

  for (const summonerName of fallbackSummonerNames) {
    let fallbackSummoner: RiotSummonerDto | null

    try {
      fallbackSummoner = await fetchRiotJson<RiotSummonerDto | null>(
        fetcher,
        buildSummonerByNameUrl(summonerName, region),
        apiKey,
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      lookupDebug.summonerLookupByNameFallback = {
        status: 'failed',
        details: `Fallback summoner-name lookup for ${summonerName} failed: ${message}`,
      }
      lookupDebug.encryptedSummonerId = {
        status: 'failed',
        details: 'No encrypted summoner id was available because the fallback summoner-name lookup failed.',
      }

      return {
        encryptedSummonerId: undefined,
        summoner,
        warning: `Riot recognized the player profile, but fallback summoner-name lookup for ${summonerName} failed (${message}). Active-game detection was skipped.`,
      }
    }

    if (!fallbackSummoner) {
      lookupDebug.summonerLookupByNameFallback = {
        status: 'not-found',
        details: `No summoner profile was returned for fallback name ${summonerName}.`,
      }
      continue
    }

    if (fallbackSummoner.id) {
      lookupDebug.summonerLookupByNameFallback = {
        status: 'success',
        details: `Resolved encrypted summoner id through fallback summoner-name lookup for ${summonerName}.`,
      }
      lookupDebug.encryptedSummonerId = {
        status: 'success',
        details: `Encrypted summoner id was recovered through fallback summoner-name lookup for ${summonerName}.`,
      }

      return {
        encryptedSummonerId: fallbackSummoner.id,
        summoner: {
          ...fallbackSummoner,
          puuid: fallbackSummoner.puuid || summoner.puuid,
        },
      }
    }
  }

  lookupDebug.encryptedSummonerId = {
    status: 'failed',
    details: 'No encrypted summoner id was available after fallback summoner-name lookup.',
  }

  return {
    encryptedSummonerId: undefined,
    summoner,
    warning:
      'Riot recognized the player profile, but did not return an encrypted summoner id for spectator lookup. Active-game detection was skipped after fallback summoner-name lookup.',
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
          details: error instanceof Error ? error.message : String(error),
        }
        throw withLookupContext('Riot account lookup failed', error)
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
          details: error instanceof Error ? error.message : String(error),
        }
        throw withLookupContext('Riot summoner profile lookup failed', error)
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
        details: summoner.id
          ? 'PUUID-based summoner lookup returned an encrypted summoner id.'
          : 'PUUID-based summoner lookup returned a summoner profile without an encrypted summoner id.',
      }

      let activeGame: RiotCurrentGameInfoDto | null = null
      let activeGameWarning: string | undefined
      const spectatorSummonerResolution = await resolveEncryptedSummonerId({
        fetcher,
        apiKey,
        region,
        account,
        summoner,
        lookupDebug,
      })

      summoner = spectatorSummonerResolution.summoner

      if (!spectatorSummonerResolution.encryptedSummonerId) {
        lookupDebug.activeGameLookup = {
          status: 'skipped',
          details: 'Active-game spectator lookup was skipped because no encrypted summoner id was available.',
        }
        activeGameWarning = spectatorSummonerResolution.warning
      } else {
        try {
          activeGame = await fetchRiotJson<RiotCurrentGameInfoDto | null>(
            fetcher,
            buildActiveGameUrl(spectatorSummonerResolution.encryptedSummonerId, region),
            apiKey,
          )
          lookupDebug.activeGameLookup = activeGame
            ? {
                status: 'success',
                details: `Active game ${activeGame.gameMode}/${activeGame.gameType} was returned by Riot spectator APIs.`,
              }
            : {
                status: 'not-found',
                details: 'No active spectatable game was returned for this player.',
              }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)

          if (message.includes('Exception decrypting undefined')) {
            lookupDebug.activeGameLookup = {
              status: 'failed',
              details: message,
            }
            activeGameWarning =
              'Riot recognized the player profile, but spectator active-game lookup could not resolve a valid encrypted summoner id. Active-game detection was skipped.'
          } else {
            lookupDebug.activeGameLookup = {
              status: 'failed',
              details: message,
            }
            throw withLookupContext('Riot active-game lookup failed', error)
          }
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
