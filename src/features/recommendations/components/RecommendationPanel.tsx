import type { RecommendationCandidate, RecommendationDimension } from '@/domain/recommendation/types'
import { Panel } from '@/shared/ui/Panel'

interface RecommendationPanelProps {
  title: string
  subtitle: string
  recommendations: RecommendationCandidate[]
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
}

export function RecommendationPanel({ title, subtitle, recommendations }: RecommendationPanelProps) {
  return (
    <Panel eyebrow="Recommendation Engine" title={title} subtitle={subtitle}>
      <div className="space-y-4">
        {recommendations.map((recommendation, index) => {
          const topDimensions = [...recommendation.breakdown.dimensions]
            .sort((left, right) => right.contribution - left.contribution)
            .slice(0, 3)
          const topReasons = recommendation.breakdown.reasons.slice(0, 2)

          return (
            <article key={`${recommendation.recommendationMode}-${recommendation.championId}`} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
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

              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {topDimensions.map((dimension) => (
                  <div key={`${recommendation.championId}-${dimension.dimension}`} className="rounded-2xl border border-slate-800 bg-slate-900/80 px-3 py-2">
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
            </article>
          )
        })}
      </div>
    </Panel>
  )
}
