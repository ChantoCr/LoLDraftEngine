import type { RiotRegion } from '@/domain/live/types'

export type RiotRegionalCluster = 'americas' | 'europe' | 'asia' | 'sea'
export type RiotPlatformId =
  | 'br1'
  | 'eun1'
  | 'euw1'
  | 'jp1'
  | 'kr'
  | 'la1'
  | 'la2'
  | 'me1'
  | 'na1'
  | 'oc1'
  | 'ph2'
  | 'ru'
  | 'sg2'
  | 'th2'
  | 'tr1'
  | 'tw2'
  | 'vn2'
  | 'pbe1'

export interface RiotRegionRouting {
  region: RiotRegion
  regionalCluster: RiotRegionalCluster
  platformId: RiotPlatformId
}

const REGION_ROUTING_MAP: Record<RiotRegion, RiotRegionRouting> = {
  BR: { region: 'BR', regionalCluster: 'americas', platformId: 'br1' },
  EUN: { region: 'EUN', regionalCluster: 'europe', platformId: 'eun1' },
  EUW: { region: 'EUW', regionalCluster: 'europe', platformId: 'euw1' },
  JP: { region: 'JP', regionalCluster: 'asia', platformId: 'jp1' },
  KR: { region: 'KR', regionalCluster: 'asia', platformId: 'kr' },
  LAN: { region: 'LAN', regionalCluster: 'americas', platformId: 'la1' },
  LAS: { region: 'LAS', regionalCluster: 'americas', platformId: 'la2' },
  MENA: { region: 'MENA', regionalCluster: 'europe', platformId: 'me1' },
  NA: { region: 'NA', regionalCluster: 'americas', platformId: 'na1' },
  OCE: { region: 'OCE', regionalCluster: 'sea', platformId: 'oc1' },
  PH: { region: 'PH', regionalCluster: 'sea', platformId: 'ph2' },
  RU: { region: 'RU', regionalCluster: 'europe', platformId: 'ru' },
  SG: { region: 'SG', regionalCluster: 'sea', platformId: 'sg2' },
  TH: { region: 'TH', regionalCluster: 'sea', platformId: 'th2' },
  TR: { region: 'TR', regionalCluster: 'europe', platformId: 'tr1' },
  TW: { region: 'TW', regionalCluster: 'sea', platformId: 'tw2' },
  VN: { region: 'VN', regionalCluster: 'sea', platformId: 'vn2' },
  PBE: { region: 'PBE', regionalCluster: 'americas', platformId: 'pbe1' },
}

export function getRiotRegionRouting(region: RiotRegion): RiotRegionRouting {
  return REGION_ROUTING_MAP[region]
}
