import { useMemo, useState } from 'react'
import { createLiveDraftProviders } from '@/data/providers/live'
import { mockChampionMap, mockChampions } from '@/data/mock/champions'
import { mockChampionPoolProfile, mockDraftState } from '@/data/mock/draft'
import { mockStatsBundle } from '@/data/mock/stats'
import { analyzeDraftComposition } from '@/domain/composition/analyzer'
import type { Role } from '@/domain/champion/types'
import {
  assignChampionToSlot,
  clearChampionFromSlot,
  setCurrentPickRole,
  setRecommendationMode,
} from '@/domain/draft/operations'
import { recommendChampionsForDraft } from '@/domain/recommendation/engine'
import { AICoachPanel } from '@/features/coach/components/AICoachPanel'
import { CompositionPanel } from '@/features/composition/components/CompositionPanel'
import { DraftBoard } from '@/features/draft-board/components/DraftBoard'
import { LiveSessionPanel } from '@/features/live-session/components/LiveSessionPanel'
import { useLiveDraftSession } from '@/features/live-session/hooks/useLiveDraftSession'
import { MetaPanel } from '@/features/meta/components/MetaPanel'
import { ChampionPoolPanel } from '@/features/pool/components/ChampionPoolPanel'
import { RecommendationPanel } from '@/features/recommendations/components/RecommendationPanel'
import { StatsIntelPanel } from '@/features/stats/components/StatsIntelPanel'

function createInteractiveDraftState() {
  return {
    ...mockDraftState,
    availableChampionIds: mockChampions.map((champion) => champion.id),
  }
}

export function DraftWorkspacePage() {
  const [draftState, setDraftState] = useState(createInteractiveDraftState)
  const liveDraftProviders = useMemo(() => createLiveDraftProviders(), [])
  const {
    identity,
    session,
    syncMode,
    setIdentity,
    setSyncMode,
    startSession,
    stopSession,
  } = useLiveDraftSession({
    providers: liveDraftProviders,
    onDraftState: setDraftState,
  })

  const derivedState = useMemo(() => {
    const compositionProfile = analyzeDraftComposition({
      draftState,
      championsById: mockChampionMap,
    })
    const bestOverallRecommendations = recommendChampionsForDraft({
      draftState,
      championsById: mockChampionMap,
      recommendationMode: 'BEST_OVERALL',
      statsBundle: mockStatsBundle,
      topN: 3,
    })
    const personalPoolRecommendations = recommendChampionsForDraft({
      draftState,
      championsById: mockChampionMap,
      recommendationMode: 'PERSONAL_POOL',
      championPool: mockChampionPoolProfile,
      statsBundle: mockStatsBundle,
      topN: 3,
    })

    const bestOverall = bestOverallRecommendations[0]
    const bestPool = personalPoolRecommendations[0]
    const firstGap = compositionProfile.structuralGaps[0]?.toLowerCase() ?? 'draft cohesion'
    const bestOverallLabel = bestOverall ? bestOverall.championName : 'no available champion'
    const bestPoolLabel = bestPool ? bestPool.championName : 'no available pool candidate'

    return {
      compositionProfile,
      bestOverallRecommendations,
      personalPoolRecommendations,
      coachSummary: `The current draft is most sensitive to ${firstGap}. ${bestOverallLabel} is the strongest theoretical answer, while ${bestPoolLabel} is the best current pool-aware option. Structured patch signals are now being blended into synergy, matchup, and meta scoring without replacing the deterministic engine.`,
    }
  }, [draftState])

  function handleAssignChampion(side: 'ALLY' | 'ENEMY', role: Role, championId: string) {
    setDraftState((currentDraftState) => assignChampionToSlot(currentDraftState, side, role, championId))
  }

  function handleClearChampion(side: 'ALLY' | 'ENEMY', role: Role) {
    setDraftState((currentDraftState) => clearChampionFromSlot(currentDraftState, side, role))
  }

  function handleCurrentRoleChange(role: Role) {
    setDraftState((currentDraftState) => setCurrentPickRole(currentDraftState, role))
  }

  function handleRecommendationModeChange(recommendationMode: typeof draftState.recommendationMode) {
    setDraftState((currentDraftState) => setRecommendationMode(currentDraftState, recommendationMode))
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
      <div className="space-y-6">
        <LiveSessionPanel
          identity={identity}
          session={session}
          syncMode={syncMode}
          onIdentityChange={setIdentity}
          onSyncModeChange={setSyncMode}
          onStartSession={startSession}
          onStopSession={stopSession}
        />

        <DraftBoard
          championsById={mockChampionMap}
          draftState={draftState}
          onAssignChampion={handleAssignChampion}
          onClearChampion={handleClearChampion}
          onSelectCurrentRole={handleCurrentRoleChange}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <RecommendationPanel
            title="Best Overall Picks"
            subtitle="The strongest theoretical answers, regardless of player comfort."
            recommendations={derivedState.bestOverallRecommendations}
          />
          <RecommendationPanel
            title="Personal Pool Picks"
            subtitle="Recommendations constrained to the current player's support pool."
            recommendations={derivedState.personalPoolRecommendations}
          />
        </div>
      </div>

      <div className="space-y-6">
        <MetaPanel
          draftState={draftState}
          onRecommendationModeChange={handleRecommendationModeChange}
          onCurrentRoleChange={handleCurrentRoleChange}
        />
        <StatsIntelPanel
          statsBundle={mockStatsBundle}
          currentRole={draftState.currentPickRole}
          championsById={mockChampionMap}
        />
        <CompositionPanel compositionProfile={derivedState.compositionProfile} />
        <ChampionPoolPanel championPool={mockChampionPoolProfile} championsById={mockChampionMap} />
        <AICoachPanel summary={derivedState.coachSummary} />
      </div>
    </div>
  )
}
