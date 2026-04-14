import type { DraftAlertSeverity, CompositionProfile, TraitName } from '@/domain/composition/types'
import { Panel } from '@/shared/ui/Panel'

interface CompositionPanelProps {
  compositionProfile: CompositionProfile
}

const severityClasses: Record<DraftAlertSeverity, string> = {
  info: 'border-cyan-400/20 bg-cyan-400/5 text-cyan-100',
  warning: 'border-amber-400/20 bg-amber-400/5 text-amber-100',
  critical: 'border-rose-400/20 bg-rose-400/5 text-rose-100',
}

const traitLabels: Record<TraitName, string> = {
  engage: 'Engage',
  disengage: 'Disengage',
  peel: 'Peel',
  poke: 'Poke',
  scaling: 'Scaling',
  dive: 'Dive',
  pick: 'Pick',
  frontline: 'Frontline',
}

export function CompositionPanel({ compositionProfile }: CompositionPanelProps) {
  const topTraits = (Object.entries(compositionProfile.averageTraits) as Array<[TraitName, number]>)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4)

  return (
    <Panel
      eyebrow="Composition Analyzer"
      title="Composition profile"
      subtitle="Structured comp identity, trait totals, and gaps exposed separately from AI explanation."
    >
      <div className="space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Archetypes</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {compositionProfile.archetypes.map((archetype) => (
              <span key={archetype} className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-sm text-cyan-200">
                {archetype.replaceAll('_', ' ')}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Damage profile</p>
            <p className="mt-2 text-lg font-semibold text-white">
              {compositionProfile.damageProfile.leaning.replace('_', ' ')}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              AD: {compositionProfile.damageProfile.physical} · AP: {compositionProfile.damageProfile.magic} · Mixed:{' '}
              {compositionProfile.damageProfile.mixed}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Top average traits</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {topTraits.map(([trait, value]) => (
                <div key={trait} className="rounded-2xl border border-slate-800 bg-slate-900/80 px-3 py-2">
                  <p className="text-xs uppercase tracking-[0.15em] text-slate-500">{traitLabels[trait]}</p>
                  <p className="mt-1 text-sm font-medium text-slate-200">{value.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-white">Strengths</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
              {compositionProfile.strengths.map((strength) => (
                <li key={strength}>• {strength}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Weaknesses</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
              {compositionProfile.weaknesses.map((weakness) => (
                <li key={weakness}>• {weakness}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Structural gaps</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              {compositionProfile.structuralGaps.map((gap) => (
                <li key={gap}>• {gap}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Execution difficulty</p>
            <p className="mt-3 text-lg font-semibold text-white">{compositionProfile.executionDifficulty}</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              This signal is intended to adjust recommendation weighting by mode, not just presentation.
            </p>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-white">Win conditions</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
            {compositionProfile.winConditions.map((condition) => (
              <li key={condition}>• {condition}</li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          {compositionProfile.alerts.map((alert) => (
            <div key={alert.id} className={`rounded-2xl border p-4 ${severityClasses[alert.severity]}`}>
              <p className="text-sm font-semibold">{alert.title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-300">{alert.description}</p>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  )
}
