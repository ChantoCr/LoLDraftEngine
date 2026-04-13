import { AICoachPanel } from '@/features/coach/components/AICoachPanel'
import { CompositionPanel } from '@/features/composition/components/CompositionPanel'
import { DraftBoard } from '@/features/draft-board/components/DraftBoard'
import { MetaPanel } from '@/features/meta/components/MetaPanel'
import { ChampionPoolPanel } from '@/features/pool/components/ChampionPoolPanel'
import { RecommendationPanel } from '@/features/recommendations/components/RecommendationPanel'
import {
  mockBestOverallRecommendations,
  mockChampionPoolProfile,
  mockCoachSummary,
  mockCompositionProfile,
  mockDraftState,
  mockPersonalPoolRecommendations,
} from '@/data/mock/draft'
import { mockChampionMap } from '@/data/mock/champions'

export function DraftWorkspacePage() {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
      <div className="space-y-6">
        <DraftBoard championsById={mockChampionMap} draftState={mockDraftState} />

        <div className="grid gap-6 lg:grid-cols-2">
          <RecommendationPanel
            title="Best Overall Picks"
            subtitle="The strongest theoretical answers, regardless of player comfort."
            recommendations={mockBestOverallRecommendations}
          />
          <RecommendationPanel
            title="Personal Pool Picks"
            subtitle="Recommendations constrained to the current player's support pool."
            recommendations={mockPersonalPoolRecommendations}
          />
        </div>
      </div>

      <div className="space-y-6">
        <MetaPanel draftState={mockDraftState} />
        <CompositionPanel compositionProfile={mockCompositionProfile} />
        <ChampionPoolPanel championPool={mockChampionPoolProfile} championsById={mockChampionMap} />
        <AICoachPanel summary={mockCoachSummary} />
      </div>
    </div>
  )
}
