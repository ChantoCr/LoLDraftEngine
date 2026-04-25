import type { ChampionPoolProfile, ChampionPoolTier } from '@/domain/champion-pool/types'
import type { Role } from '@/domain/champion/types'
import { clamp, roundTo } from '@/domain/common/math'
import type { SummonerIdentity } from '@/domain/live/types'
import { getServerConfig } from '@server/config/env'
import { loadDesktopChampionCatalog } from '@server/live/desktopClient/championCatalog'
import { createRiotApiClient, type RiotRecognizedPlayer } from '@server/live/riot/client'

interface RiotChampionMasteryDto {
  championId: number
  championLevel?: number
  championPoints: number
  lastPlayTime?: number
}

interface ResolveRiotChampionPoolInput {
  identity: SummonerIdentity
  role: Role
  patchVersion: string
  limit?: number
  apiKey?: string
  fetcher?: typeof fetch
  loadChampionCatalog?: typeof loadDesktopChampionCatalog
}

function buildChampionMasteryTopUrl(summonerId: string, region: SummonerIdentity['region'], count: number) {
  const platformIdByRegion: Record<SummonerIdentity['region'], string> = {
    BR: 'br1',
    EUN: 'eun1',
    EUW: 'euw1',
    JP: 'jp1',
    KR: 'kr',
    LAN: 'la1',
    LAS: 'la2',
    MENA: 'me1',
    NA: 'na1',
    OCE: 'oc1',
    PH: 'ph2',
    RU: 'ru',
    SG: 'sg2',
    TH: 'th2',
    TR: 'tr1',
    TW: 'tw2',
    VN: 'vn2',
    PBE: 'pbe1',
  }

  return `https://${platformIdByRegion[region]}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/${encodeURIComponent(summonerId)}/top?count=${count}`
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

async function fetchChampionMasteries({
  apiKey,
  fetcher = fetch,
  summonerId,
  region,
  count,
}: {
  apiKey: string
  fetcher?: typeof fetch
  summonerId: string
  region: SummonerIdentity['region']
  count: number
}): Promise<RiotChampionMasteryDto[]> {
  const response = await fetcher(buildChampionMasteryTopUrl(summonerId, region, count), {
    headers: {
      'X-Riot-Token': apiKey,
    },
  })

  if (!response.ok) {
    throw new Error(await readRiotErrorMessage(response, `Riot champion mastery lookup failed: ${response.status} ${response.statusText}`))
  }

  return (await response.json()) as RiotChampionMasteryDto[]
}

function matchesRequestedRole(recommendedRoles: Role[] | undefined, role: Role) {
  if (!recommendedRoles || recommendedRoles.length === 0) {
    return true
  }

  return recommendedRoles.includes(role)
}

function toPoolTier(index: number): ChampionPoolTier {
  if (index === 0) {
    return 'MAIN'
  }

  if (index <= 2) {
    return 'COMFORT'
  }

  if (index <= 5) {
    return 'PLAYABLE'
  }

  return 'EMERGENCY'
}

function toMasteryConfidence({
  championLevel,
  championPoints,
  highestPoints,
  rank,
  totalCount,
}: {
  championLevel?: number
  championPoints: number
  highestPoints: number
  rank: number
  totalCount: number
}) {
  const relativePoints = highestPoints > 0 ? championPoints / highestPoints : 0
  const levelComponent = clamp((championLevel ?? 0) / 7, 0, 1)
  const rankComponent = totalCount > 1 ? 1 - rank / (totalCount - 1) : 1

  return clamp(roundTo(relativePoints * 0.5 + levelComponent * 0.3 + rankComponent * 0.2, 2), 0, 1)
}

function normalizeRiotIdentityPart(value: string | undefined) {
  return value?.trim().toLowerCase()
}

function resolveEncryptedSummonerId(recognizedPlayer: RiotRecognizedPlayer) {
  if (recognizedPlayer.summoner.id) {
    return recognizedPlayer.summoner.id
  }

  const normalizedGameName = normalizeRiotIdentityPart(recognizedPlayer.account.gameName)
  const normalizedTagLine = normalizeRiotIdentityPart(recognizedPlayer.account.tagLine)
  const matchingParticipant = recognizedPlayer.activeGame?.participants.find((participant) => {
    if (participant.puuid && participant.puuid === recognizedPlayer.account.puuid) {
      return true
    }

    return (
      normalizeRiotIdentityPart(participant.riotIdGameName) === normalizedGameName &&
      normalizeRiotIdentityPart(participant.riotIdTagline) === normalizedTagLine
    )
  })

  return matchingParticipant?.summonerId
}

export async function resolveRiotChampionPool({
  identity,
  role,
  patchVersion,
  limit = 8,
  apiKey = getServerConfig().riotApiKey ?? undefined,
  fetcher = fetch,
  loadChampionCatalog = loadDesktopChampionCatalog,
}: ResolveRiotChampionPoolInput): Promise<ChampionPoolProfile> {
  if (!apiKey) {
    throw new Error('RIOT_API_KEY is not configured on the backend companion, so Riot champion-pool lookup is unavailable.')
  }

  const client = createRiotApiClient({ apiKey, fetcher })
  const recognizedPlayer = await client.recognizePlayerByRiotId(identity)
  const summonerId = resolveEncryptedSummonerId(recognizedPlayer)

  if (!summonerId) {
    throw new Error(
      'Riot recognition succeeded, but Riot did not expose the encrypted summoner id needed for champion mastery lookup in the current summoner or active-game participant data.',
    )
  }

  const { championCatalog } = await loadChampionCatalog(patchVersion)
  const championCatalogByRiotChampionId = new Map(championCatalog.map((champion) => [champion.riotChampionId, champion]))
  const masteries = await fetchChampionMasteries({
    apiKey,
    fetcher,
    summonerId,
    region: identity.region,
    count: Math.max(limit * 3, 15),
  })

  const mappedMasteries = masteries.flatMap((mastery) => {
    const champion = championCatalogByRiotChampionId.get(mastery.championId)

    return champion
      ? [
          {
            championId: champion.championId,
            recommendedRoles: champion.recommendedRoles,
            championLevel: mastery.championLevel,
            championPoints: mastery.championPoints,
          },
        ]
      : []
  })

  const roleScopedMasteries = mappedMasteries.filter((mastery) => matchesRequestedRole(mastery.recommendedRoles, role))
  const selectedMasteries = (roleScopedMasteries.length > 0 ? roleScopedMasteries : mappedMasteries).slice(0, limit)
  const highestPoints = selectedMasteries[0]?.championPoints ?? 0

  return {
    playerLabel: `${recognizedPlayer.account.gameName}#${recognizedPlayer.account.tagLine} · ${role} pool`,
    role,
    source: 'RIOT_API',
    entries: selectedMasteries.map((mastery, index) => ({
      championId: mastery.championId,
      tier: toPoolTier(index),
      masteryConfidence: toMasteryConfidence({
        championLevel: mastery.championLevel,
        championPoints: mastery.championPoints,
        highestPoints,
        rank: index,
        totalCount: selectedMasteries.length,
      }),
    })),
  }
}
