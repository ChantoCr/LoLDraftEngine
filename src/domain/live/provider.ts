import type { DraftState } from '@/domain/draft/types'
import type { LiveDraftSession, SummonerIdentity } from '@/domain/live/types'

export interface LiveDraftProvider {
  recognizePlayer(identity: SummonerIdentity): Promise<LiveDraftSession>
  subscribeToLiveDraft(
    session: LiveDraftSession,
    onDraftState: (draftState: DraftState) => void,
    onSessionUpdate?: (session: Partial<LiveDraftSession>) => void,
  ): Promise<() => void>
}
