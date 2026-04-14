export type RiotRegion =
  | 'BR'
  | 'EUN'
  | 'EUW'
  | 'JP'
  | 'KR'
  | 'LAN'
  | 'LAS'
  | 'MENA'
  | 'NA'
  | 'OCE'
  | 'PH'
  | 'RU'
  | 'SG'
  | 'TH'
  | 'TR'
  | 'TW'
  | 'VN'
  | 'PBE'

export interface SummonerIdentity {
  gameName: string
  tagLine: string
  region: RiotRegion
}

export type LiveDraftSyncMode = 'MANUAL' | 'MOCK' | 'RIOT_API' | 'DESKTOP_CLIENT'
export type LiveDraftConnectionStatus = 'idle' | 'manual' | 'connecting' | 'connected' | 'error'

export interface LiveDraftSession {
  sessionId?: string
  player?: SummonerIdentity
  status: LiveDraftConnectionStatus
  syncMode: LiveDraftSyncMode
  lastSyncAt?: string
  message?: string
}
