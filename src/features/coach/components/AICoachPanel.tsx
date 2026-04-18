import type { LiveGamePlan } from '@/domain/game-plan/types'
import { Panel } from '@/shared/ui/Panel'

interface AICoachPanelProps {
  summary: string
  gamePlan: LiveGamePlan
}

const prompts = [
  'What is my exact job in the next objective fight?',
  'What enemy threat must we respect the most?',
  'How should we play our comp if the game slows down?',
]

export function AICoachPanel({ summary, gamePlan }: AICoachPanelProps) {
  return (
    <Panel
      eyebrow="AI Coach Layer"
      title="Strategic explanation"
      subtitle="LLM output should stay downstream of structured signals from the analyzer, game-plan layer, and recommendation engine."
    >
      <div className="space-y-4">
        <p className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm leading-7 text-slate-300">
          {summary}
        </p>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Your job</p>
            <p className="mt-2 leading-6">{gamePlan.playerJob}</p>
            <p className="mt-3 text-xs text-slate-500">
              Role: {gamePlan.playerRole}
              {gamePlan.playerChampionName ? ` · Champion: ${gamePlan.playerChampionName}` : ''}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Live game plan</p>
            <p className="mt-2 leading-6">{gamePlan.easiestWinCondition}</p>
            <p className="mt-3 leading-6">{gamePlan.keyThreat}</p>
            <p className="mt-3 text-xs text-slate-500">
              Ally identity: {gamePlan.allyIdentity.join(', ') || 'Unknown'} · Enemy identity:{' '}
              {gamePlan.enemyIdentity.join(', ') || 'Unknown'} · Execution: {gamePlan.executionDifficulty}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Practical play rules</p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-300">
            {gamePlan.practicalRules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Suggested follow-up prompts</p>
          <div className="mt-3 space-y-2">
            {prompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-left text-sm text-slate-300 transition hover:border-slate-700 hover:bg-slate-950"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  )
}
