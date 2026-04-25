import type { ProductMode } from '@/domain/draft/types'

export type MatchQueueType =
  | 'RANKED_SOLO_DUO'
  | 'RANKED_FLEX'
  | 'CLASH'
  | 'NORMAL_DRAFT'
  | 'NORMAL_BLIND'
  | 'QUICKPLAY'
  | 'ARAM'
  | 'CUSTOM'
  | 'TOURNAMENT'
  | 'UNKNOWN'

export interface DraftQueueContext {
  queueId?: number
  queueType: MatchQueueType
  label: string
}

const QUEUE_LABELS: Record<MatchQueueType, string> = {
  RANKED_SOLO_DUO: 'Ranked Solo/Duo',
  RANKED_FLEX: 'Ranked Flex',
  CLASH: 'Clash',
  NORMAL_DRAFT: 'Normal Draft',
  NORMAL_BLIND: 'Normal Blind',
  QUICKPLAY: 'Quickplay',
  ARAM: 'ARAM',
  CUSTOM: 'Custom Game',
  TOURNAMENT: 'Tournament',
  UNKNOWN: 'Unknown Queue',
}

export function getMatchQueueLabel(queueType: MatchQueueType) {
  return QUEUE_LABELS[queueType]
}

export function createDraftQueueContext(queueType: MatchQueueType, queueId?: number): DraftQueueContext {
  return {
    queueId,
    queueType,
    label: getMatchQueueLabel(queueType),
  }
}

export function deriveProductModeFromQueueType(queueType: MatchQueueType): ProductMode {
  switch (queueType) {
    case 'RANKED_SOLO_DUO':
      return 'SOLO_QUEUE'
    case 'RANKED_FLEX':
    case 'CLASH':
    case 'NORMAL_DRAFT':
    case 'NORMAL_BLIND':
    case 'QUICKPLAY':
    case 'ARAM':
      return 'CLASH'
    case 'CUSTOM':
    case 'TOURNAMENT':
      return 'COMPETITIVE'
    case 'UNKNOWN':
    default:
      return 'SOLO_QUEUE'
  }
}
