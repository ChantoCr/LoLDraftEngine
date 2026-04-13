import type { PropsWithChildren } from 'react'

const pillars = ['Composition Analyzer', 'Recommendation Engine', 'Stats Layer', 'AI Coach Layer']

export function AppShell({ children }: PropsWithChildren) {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <header className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/40 backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                Interactive League of Legends Draft Intelligence Platform
              </span>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Draft workspace scaffolded for domain-first product development.
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base">
                UI, domain, data, and AI orchestration are separated so the deterministic draft engine
                can evolve independently from presentation and explanation layers.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {pillars.map((pillar) => (
                <div
                  key={pillar}
                  className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-300"
                >
                  {pillar}
                </div>
              ))}
            </div>
          </div>
        </header>

        <section className="mt-8">{children}</section>
      </div>
    </main>
  )
}
