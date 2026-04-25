import { createDraftQueueContext, deriveProductModeFromQueueType, type DraftQueueContext, type MatchQueueType } from '@/domain/draft/queue'
import type { ProductMode } from '@/domain/draft/types'

const RIOT_QUEUE_ID_TO_TYPE: Record<number, MatchQueueType> = {
  400: 'NORMAL_DRAFT',
  430: 'NORMAL_BLIND',
  420: 'RANKED_SOLO_DUO',
  440: 'RANKED_FLEX',
  450: 'ARAM',
  490: 'QUICKPLAY',
  700: 'CLASH',
}

function deriveQueueTypeFromModeAndType(gameMode?: string, gameType?: string): MatchQueueType {
  const normalizedGameMode = gameMode?.trim().toUpperCase()
  const normalizedGameType = gameType?.trim().toUpperCase()

  if (normalizedGameMode === 'ARAM') {
    return 'ARAM'
  }

  if (normalizedGameType === 'CUSTOM_GAME') {
    return 'CUSTOM'
  }

  if (normalizedGameType === 'TUTORIAL_GAME') {
    return 'CUSTOM'
  }

  if (normalizedGameType === 'MATCHED_GAME' && normalizedGameMode === 'CLASSIC') {
    return 'UNKNOWN'
  }

  return 'UNKNOWN'
}

export function resolveRiotQueueType(queueId?: number, gameMode?: string, gameType?: string): MatchQueueType {
  if (queueId && RIOT_QUEUE_ID_TO_TYPE[queueId]) {
    return RIOT_QUEUE_ID_TO_TYPE[queueId]
  }

  return deriveQueueTypeFromModeAndType(gameMode, gameType)
}

export function buildRiotDraftQueueContext({
  queueId,
  gameMode,
  gameType,
}: {
  queueId?: number
  gameMode?: string
  gameType?: string
}): DraftQueueContext {
  return createDraftQueueContext(resolveRiotQueueType(queueId, gameMode, gameType), queueId)
}

export function deriveProductModeFromRiotQueue(params: {
  queueId?: number
  gameMode?: string
  gameType?: string
}): ProductMode {
  return deriveProductModeFromQueueType(resolveRiotQueueType(params.queueId, params.gameMode, params.gameType))
}
