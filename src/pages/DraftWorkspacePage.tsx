import { analyzeDraftComposition } from '@/domain/composition/analyzer'
import { recommendChampionsForDraft } from '@/domain/recommendation/engine'
import { AICoachPanel } from '@/features/coach/components/AICoachPanel'
import { CompositionPanel } from '@/features/composition/components/CompositionPanel'
import { DraftBoard } from '@/features/draft-board/components/DraftBoard'
import { MetaPanel } from '@/features/meta/components/MetaPanel'
import { ChampionPoolPanel } from '@/features/pool/components/ChampionPoolPanel'
import { RecommendationPanel } from '@/features/recommendations/components/RecommendationPanel'
import { mockChampionPoolProfile, mockDraftState } from '@/data/mock/draft'
import { mockChampionMap } from '@/data/mock/champions'

function buildCoachSummary() {
  const compositionProfile = analyzeDraftComposition({ draftState: mockDraftState, championsById: mockChampionMap })
  const bestOverallRecommendations = recommendChampionsForDraft({
    draftState: mockDraftState,
    championsById: mockChampionMap,
    recommendationMode: 'BEST_OVERALL',
    topN: 3,
  })
  const personalPoolRecommendations = recommendChampionsForDraft({
    draftState: mockDraftState,
    championsById: mockChampionMap,
    recommendationMode: 'PERSONAL_POOL',
    championPool: mockChampionPoolProfile,
    topN: 3,
  })

  const bestOverall = bestOverallRecommendations[0]
  const bestPool = personalPoolRecommendations[0]
  const firstGap = compositionProfile.structuralGaps[0]?.toLowerCase() ?? 'draft cohesion'
  const safestPoolLabel = bestPool ? `${bestPool.championName} inside the current pool` : 'no pool candidate'
  const bestOverallLabel = bestOverall ? bestOverall.championName : 'no available champion'

  return {
    compositionProfile,
    bestOverallRecommendations,
    personalPoolRecommendations,
    coachSummary: `The current draft is most sensitive to ${firstGap}. ${bestOverallLabel} is the strongest theoretical recommendation, while ${safestPoolLabel} is the most realistic pool-aware answer for this spot.`,
  }
}

export function DraftWorkspacePage() {
  const {
    compositionProfile,
    bestOverallRecommendations,
    personalPoolRecommendations,
    coachSummary,
  } = buildCoachSummary()

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
      <div className="space-y-6">
        <DraftBoard championsById={mockChampionMap} draftState={mockDraftState} />

        <div className="grid gap-6 lg:grid-cols-2">
          <RecommendationPanel
            title="Best Overall Picks"
            subtitle="The strongest theoretical answers, regardless of player comfort."
            recommendations={bestOverallRecommendations}
          />
          <RecommendationPanel
            title="Personal Pool Picks"
            subtitle="Recommendations constrained to the current player's support pool."
            recommendations={personalPoolRecommendations}
          />
        </div>
      </div>

      <div className="space-y-6">
        <MetaPanel draftState={mockDraftState} />
        <CompositionPanel compositionProfile={compositionProfile} />
        <ChampionPoolPanel championPool={mockChampionPoolProfile} championsById={mockChampionMap} />
        <AICoachPanel summary={coachSummary} />
      </div>
    </div>
  )
}
