import type { ChampionClass } from '@/domain/champion/types'
import { createConfidenceIndicator, createDataFreshness } from '@/domain/stats/factories'
import type { ChampionRecord } from '@/domain/stats/types'
import type {
  DDragonChampionCollectionResponse,
  DDragonChampionDataItem,
} from '@/data/providers/dDragon/types'

interface NormalizeDDragonChampionCollectionInput {
  patchVersion?: string
  locale?: string
  fetchedAt?: string
  source?: 'DDRAGON' | 'FIXTURE'
}

const DDRAGON_TAG_TO_CLASS: Partial<Record<string, ChampionClass[]>> = {
  Tank: ['TANK'],
  Fighter: ['FIGHTER'],
  Mage: ['MAGE'],
  Assassin: ['ASSASSIN'],
  Marksman: ['MARKSMAN'],
  Support: ['ENCHANTER'],
}

function normalizeChampionClasses(tags: string[]) {
  return tags.flatMap((tag) => DDRAGON_TAG_TO_CLASS[tag] ?? [])
}

function toChampionId(rawId: string) {
  return rawId.toLowerCase().replaceAll(/[^a-z0-9]/g, '')
}

function buildSquareImageUrl(patchVersion: string, imageFull: string) {
  return `https://ddragon.leagueoflegends.com/cdn/${patchVersion}/img/champion/${imageFull}`
}

export function normalizeDDragonChampion(
  champion: DDragonChampionDataItem,
  {
    patchVersion = champion.version,
    fetchedAt,
    source = 'DDRAGON',
  }: NormalizeDDragonChampionCollectionInput = {},
): ChampionRecord {
  return {
    id: toChampionId(champion.id),
    key: champion.key,
    name: champion.name,
    title: champion.title,
    patchVersion,
    source,
    sourceVersion: champion.version,
    classes: normalizeChampionClasses(champion.tags),
    recommendedRoles: [],
    resource: champion.partype,
    image: {
      square: buildSquareImageUrl(patchVersion, champion.image.full),
    },
    kitRatings: {
      attack: champion.info.attack,
      defense: champion.info.defense,
      magic: champion.info.magic,
      difficulty: champion.info.difficulty,
    },
    baseStats: {
      hp: champion.stats.hp,
      hpPerLevel: champion.stats.hpperlevel,
      mp: champion.stats.mp,
      mpPerLevel: champion.stats.mpperlevel,
      armor: champion.stats.armor,
      armorPerLevel: champion.stats.armorperlevel,
      moveSpeed: champion.stats.movespeed,
    },
    rolePerformances: [],
    freshness: createDataFreshness({
      source,
      patchVersion,
      fetchedAt,
    }),
  }
}

export function normalizeDDragonChampionCollection(
  payload: DDragonChampionCollectionResponse,
  options: NormalizeDDragonChampionCollectionInput = {},
): ChampionRecord[] {
  return Object.values(payload.data)
    .map((champion) => normalizeDDragonChampion(champion, { ...options, patchVersion: options.patchVersion ?? payload.version }))
    .sort((left, right) => left.name.localeCompare(right.name))
}

export function createPlaceholderRoleConfidence() {
  return createConfidenceIndicator({
    score: 0.2,
    reasons: ['Data Dragon does not provide role win-rate or matchup statistics by itself.'],
  })
}
