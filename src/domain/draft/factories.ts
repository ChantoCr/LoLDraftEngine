import type { Role } from '@/domain/champion/types'
import {
  DEFAULT_PRODUCT_MODE,
  DEFAULT_RECOMMENDATION_MODE,
  ROLE_ORDER,
} from '@/domain/draft/constants'
import type {
  DraftSlot,
  DraftState,
  ProductMode,
  RecommendationMode,
  TeamDraft,
  TeamSide,
} from '@/domain/draft/types'

interface DraftSlotInput {
  championId?: string
  isLocked?: boolean
}

interface CreateDraftStateInput {
  patchVersion: string
  currentPickRole: Role
  productMode?: ProductMode
  recommendationMode?: RecommendationMode
  allyPicks?: Partial<Record<Role, DraftSlotInput>>
  enemyPicks?: Partial<Record<Role, DraftSlotInput>>
  allyBans?: string[]
  enemyBans?: string[]
  availableChampionIds?: string[]
}

export function createDraftSlot(role: Role, input?: DraftSlotInput): DraftSlot {
  return {
    role,
    championId: input?.championId,
    isLocked: input?.isLocked ?? false,
  }
}

export function createTeamDraft(
  side: TeamSide,
  picksByRole: Partial<Record<Role, DraftSlotInput>> = {},
  bans: string[] = [],
): TeamDraft {
  return {
    side,
    bans,
    picks: ROLE_ORDER.map((role) => createDraftSlot(role, picksByRole[role])),
  }
}

export function createDraftState(input: CreateDraftStateInput): DraftState {
  return {
    patchVersion: input.patchVersion,
    productMode: input.productMode ?? DEFAULT_PRODUCT_MODE,
    recommendationMode: input.recommendationMode ?? DEFAULT_RECOMMENDATION_MODE,
    currentPickRole: input.currentPickRole,
    allyTeam: createTeamDraft('ALLY', input.allyPicks, input.allyBans),
    enemyTeam: createTeamDraft('ENEMY', input.enemyPicks, input.enemyBans),
    availableChampionIds: input.availableChampionIds ?? [],
  }
}
