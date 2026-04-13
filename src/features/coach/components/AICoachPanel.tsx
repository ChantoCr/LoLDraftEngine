import { Panel } from '@/shared/ui/Panel'

interface AICoachPanelProps {
  summary: string
}

const prompts = [
  'Why is Nautilus better than Braum here?',
  'What is our easiest win condition after support pick?',
  'Which option is best if the player wants lower execution risk?',
]

export function AICoachPanel({ summary }: AICoachPanelProps) {
  return (
    <Panel
      eyebrow="AI Coach Layer"
      title="Strategic explanation"
      subtitle="LLM output should stay downstream of structured signals from the analyzer and recommendation engine."
    >
      <div className="space-y-4">
        <p className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm leading-7 text-slate-300">
          {summary}
        </p>

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
