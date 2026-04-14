import type { LiveDraftSyncMode, RiotRegion } from '@/domain/live/types'

export const LIVE_DRAFT_SYNC_MODE_LABELS: Record<LiveDraftSyncMode, string> = {
  MANUAL: 'Manual',
  MOCK: 'Mock live feed',
  RIOT_API: 'Riot API',
  DESKTOP_CLIENT: 'Desktop client',
}

export const RIOT_REGIONS: RiotRegion[] = [
  'BR',
  'EUN',
  'EUW',
  'JP',
  'KR',
  'LAN',
  'LAS',
  'MENA',
  'NA',
  'OCE',
  'PH',
  'RU',
  'SG',
  'TH',
  'TR',
  'TW',
  'VN',
  'PBE',
]

export const RIOT_REGION_LABELS: Record<RiotRegion, string> = {
  BR: 'Brazil',
  EUN: 'Europe Nordic & East',
  EUW: 'Europe West',
  JP: 'Japan',
  KR: 'Korea',
  LAN: 'Latin America North',
  LAS: 'Latin America South',
  MENA: 'Middle East & North Africa',
  NA: 'North America',
  OCE: 'Oceania',
  PH: 'Philippines',
  RU: 'Russia',
  SG: 'Singapore',
  TH: 'Thailand',
  TR: 'Turkey',
  TW: 'Taiwan',
  VN: 'Vietnam',
  PBE: 'Public Beta Environment',
}
