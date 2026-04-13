import type { ReactNode } from 'react'

interface PanelProps {
  title: string
  subtitle?: string
  eyebrow?: string
  actions?: ReactNode
  className?: string
  children: ReactNode
}

export function Panel({ title, subtitle, eyebrow, actions, className, children }: PanelProps) {
  const classes = [
    'rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-slate-950/20 backdrop-blur',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <section className={classes}>
      <div className="flex items-start justify-between gap-4">
        <div>
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">{eyebrow}</p>
          ) : null}
          <h2 className="mt-1 text-xl font-semibold text-white">{title}</h2>
          {subtitle ? <p className="mt-2 text-sm text-slate-400">{subtitle}</p> : null}
        </div>
        {actions ? <div>{actions}</div> : null}
      </div>

      <div className="mt-5">{children}</div>
    </section>
  )
}
