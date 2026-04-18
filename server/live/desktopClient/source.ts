import type { ChampionClass, Role } from '@/domain/champion/types'
import type { ProductMode, RecommendationMode, DraftState } from '@/domain/draft/types'

export type DesktopCompanionSourceKind = 'FILE' | 'LCU'
export type DesktopCompanionSourceStatus = 'active' | 'unavailable'

export interface DesktopCompanionSourceSnapshot<TPayload = unknown> {
  kind: DesktopCompanionSourceKind
  status: DesktopCompanionSourceStatus
  observedAt: string
  message?: string
  sourceEventId?: string
  rawPayload?: TPayload
  draftState?: DraftState
}

export interface DesktopCompanionDraftSource<TPayload = unknown> {
  readSnapshot(): Promise<DesktopCompanionSourceSnapshot<TPayload> | undefined>
  describe(): string
}

export interface DesktopChampionCatalogEntry {
  championId: string
  riotChampionId: number
  recommendedRoles?: Role[]
  classes?: ChampionClass[]
}

export interface DesktopChampSelectMapperContext {
  patchVersion: string
  championCatalog: DesktopChampionCatalogEntry[]
  productMode?: ProductMode
  recommendationMode?: RecommendationMode
}
