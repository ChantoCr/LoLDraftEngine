import { RECOMMENDATION_MODE_LABELS } from '@/domain/draft/constants'
import type { RecommendationMode } from '@/domain/draft/types'
import type { RecommendationModeComparison } from '@/domain/recommendation/compare'
import type { RecommendationDimension, RecommendationPackage } from '@/domain/recommendation/types'
import { Panel } from '@/shared/ui/Panel'

interface RecommendationPanelProps {
  activeMode: RecommendationMode
  bestOverallRecommendations: RecommendationPackage[]
  personalPoolRecommendations: RecommendationPackage[]
  comparison?: RecommendationModeComparison
  onModeChange: (mode: RecommendationMode) => void
}

const dimensionLabels: Record<RecommendationDimension, string> = {
  allySynergy: 'Synergy',
  enemyCounter: 'Counter',
  compRepair: 'Comp Repair',
  damageBalance: 'Damage Balance',
  frontlineImpact: 'Frontline',
  engageImpact: 'Engage',
  peelImpact: 'Peel',
  executionFit: 'Execution',
  metaValue: 'Meta',
  comfortFit: 'Comfort',
  laneMatchupFit: 'Lane',
  objectiveSetupFit: 'Objectives',
  macroPostureFit: 'Macro',
}

export function RecommendationPanel({
  activeMode,
  bestOverallRecommendations,
  personalPoolRecommendations,
  comparison,
  onModeChange,
}: RecommendationPanelProps) {
  const recommendations = activeMode === 'PERSONAL_POOL' ? personalPoolRecommendations : bestOverallRecommendations
  const subtitle =
    activeMode === 'PERSONAL_POOL'
      ? 'Viewing role-aware recommendations constrained to the current player pool.'
      : 'Viewing the strongest theoretical answers regardless of current champion comfort.'

  return (
    <Panel
      eyebrow="Recommendation Engine"
      title="Recommendations"
      subtitle="One deterministic recommendation surface, with explicit tabs for best-overall vs personal-pool outputs."
      actions={
        <div className="inline-flex rounded-2xl border border-slate-800 bg-slate-950/80 p-1">
          {(['BEST_OVERALL', 'PERSONAL_POOL'] as RecommendationMode[]).map((mode) => {
            const isActive = activeMode === mode

            return (
              <button
                key={mode}
                type="button"
                onClick={() => onModeChange(mode)}
                className={`rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                  isActive
                    ? 'bg-cyan-400/10 text-cyan-200'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                {RECOMMENDATION_MODE_LABELS[mode]}
              </button>
            )
          })}
        </div>
      }
    >
      <div className="mb-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
        <p className="text-sm font-medium text-slate-100">{RECOMMENDATION_MODE_LABELS[activeMode]}</p>
        <p className="mt-2 text-sm leading-6 text-slate-400">{subtitle}</p>
      </div>

      {comparison ? (
        <div className="mb-4 rounded-2xl border border-cyan-900/60 bg-cyan-950/20 p-4">
          <p className="text-sm font-semibold text-cyan-100">{comparison.headline}</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">{comparison.summary}</p>
          {comparison.tradeoff ? <p className="mt-2 text-xs text-cyan-300">{comparison.tradeoff}</p> : null}
        </div>
      ) : null}

      {recommendations.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-400">
          {activeMode === 'PERSONAL_POOL'
            ? 'No in-pool candidates are currently available for the active role or current board state.'
            : 'No candidates are currently available for the active role or board state.'}
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((entry, index) => {
            const recommendation = entry.candidate
            const build = entry.build
            const topDimensions = [...recommendation.breakdown.dimensions]
              .sort((left, right) => right.contribution - left.contribution)
              .slice(0, 3)
            const topReasons = recommendation.breakdown.reasons.slice(0, 2)

            return (
              <article
                key={`${recommendation.recommendationMode}-${recommendation.championId}`}
                className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-cyan-400/10 text-sm font-semibold text-cyan-300">
                        {index + 1}
                      </span>
                      <h3 className="text-lg font-semibold text-white">{recommendation.championName}</h3>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {recommendation.tags.map((tag) => (
                        <span
                          key={`${recommendation.championId}-${tag}`}
                          className="rounded-full border border-slate-700 px-2.5 py-1 text-xs text-slate-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Score</p>
                    <p className="text-2xl font-semibold text-white">{recommendation.breakdown.totalScore}</p>
                    <p className="text-xs text-slate-400">Confidence: {recommendation.breakdown.confidence}</p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-cyan-900/50 bg-cyan-950/20 p-4">
                  <p className="text-sm font-semibold text-cyan-100">{recommendation.narrative.headline}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{recommendation.narrative.summary}</p>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-300">
                    {recommendation.narrative.decisionFactors.map((factor) => (
                      <li key={factor}>{factor}</li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {topDimensions.map((dimension) => (
                    <div
                      key={`${recommendation.championId}-${dimension.dimension}`}
                      className="rounded-2xl border border-slate-800 bg-slate-900/80 px-3 py-2"
                    >
                      <p className="text-xs uppercase tracking-[0.15em] text-slate-500">
                        {dimensionLabels[dimension.dimension]}
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-200">{dimension.score.toFixed(1)}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 space-y-3">
                  {topReasons.map((reason) => (
                    <div
                      key={reason.id}
                      className={`rounded-2xl border p-3 ${
                        reason.direction === 'pro'
                          ? 'border-emerald-400/20 bg-emerald-400/5'
                          : 'border-amber-400/20 bg-amber-400/5'
                      }`}
                    >
                      <p
                        className={`text-sm font-medium ${
                          reason.direction === 'pro' ? 'text-emerald-200' : 'text-amber-200'
                        }`}
                      >
                        {reason.label}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-300">{reason.explanation}</p>
                    </div>
                  ))}
                </div>

                {build ? (
                  <div className="mt-4 rounded-2xl border border-violet-900/50 bg-violet-950/20 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-violet-100">{build.explanation.headline}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-300">{build.explanation.summary}</p>
                      </div>
                      <div className="text-right text-xs text-slate-400">
                        <p>Build confidence: {build.confidence}</p>
                        <p>Profile: {build.dataQuality.championProfileSource.toLowerCase()}</p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 lg:grid-cols-3">
                      {build.starter ? (
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
                          <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Starter</p>
                          <p className="mt-2 text-sm font-medium text-slate-100">
                            {build.starter.items.map((item) => item.itemName).join(', ')}
                          </p>
                          <p className="mt-2 text-xs leading-5 text-slate-400">{build.starter.explanation}</p>
                        </div>
                      ) : null}

                      {build.firstBuy ? (
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
                          <p className="text-xs uppercase tracking-[0.15em] text-slate-500">First Buy</p>
                          <p className="mt-2 text-sm font-medium text-slate-100">
                            {build.firstBuy.items.map((item) => item.itemName).join(', ')}
                          </p>
                          <p className="mt-2 text-xs leading-5 text-slate-400">{build.firstBuy.explanation}</p>
                        </div>
                      ) : null}

                      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
                        <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Core Path</p>
                        <ul className="mt-2 space-y-2 text-sm text-slate-100">
                          {build.corePath.map((step) => (
                            <li key={`${build.championId}-${step.label}`}>
                              <span className="font-medium">{step.items.map((item) => item.itemName).join(', ')}</span>
                              <p className="mt-1 text-xs leading-5 text-slate-400">{step.explanation}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {build.situationalBranches.length > 0 ? (
                      <div className="mt-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">Situational branches</p>
                        <div className="mt-3 space-y-3">
                          {build.situationalBranches.map((branch) => (
                            <div key={branch.id} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <p className="text-sm font-medium text-slate-100">{branch.label}</p>
                                <p className="text-xs uppercase tracking-[0.15em] text-slate-500">{branch.severity}</p>
                              </div>
                              <p className="mt-1 text-sm text-slate-300">
                                {branch.items.map((item) => item.itemName).join(', ')}
                              </p>
                              <p className="mt-2 text-xs leading-5 text-slate-400">{branch.explanation}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-300">
                      {build.explanation.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>

                    {build.dataQuality.notes.length > 0 ? (
                      <p className="mt-4 text-xs leading-5 text-slate-400">{build.dataQuality.notes.join(' ')}</p>
                    ) : null}
                  </div>
                ) : null}
              </article>
            )
          })}
        </div>
      )}
    </Panel>
  )
}
