import { useEffect, useMemo, useState } from 'react'
import type { Role } from '@/domain/champion/types'
import type { ChampionCatalogEntry } from '@/domain/champion/catalog'

interface ChampionSearchSelectProps {
  role: Role
  selectedChampionId?: string
  options: ChampionCatalogEntry[]
  disabledChampionIds?: string[]
  onSelectChampion: (championId: string) => void
  onClearChampion?: () => void
  placeholder?: string
  restrictToRole?: boolean
}

function matchesRole(option: ChampionCatalogEntry, role: Role, restrictToRole: boolean) {
  if (!restrictToRole) {
    return true
  }

  return option.roles.length === 0 || option.roles.includes(role)
}

export function ChampionSearchSelect({
  role,
  selectedChampionId,
  options,
  disabledChampionIds = [],
  onSelectChampion,
  onClearChampion,
  placeholder = 'Search champion...',
  restrictToRole = true,
}: ChampionSearchSelectProps) {
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLowerCase()

  const eligibleOptions = useMemo(() => {
    return options
      .filter((option) => matchesRole(option, role, restrictToRole))
      .filter((option) => !disabledChampionIds.includes(option.id) || option.id === selectedChampionId)
  }, [disabledChampionIds, options, restrictToRole, role, selectedChampionId])

  const filteredOptions = useMemo(() => {
    return eligibleOptions
      .filter((option) => (normalizedQuery ? option.name.toLowerCase().includes(normalizedQuery) : true))
      .slice(0, 12)
  }, [eligibleOptions, normalizedQuery])

  const selectedChampion = options.find((option) => option.id === selectedChampionId)

  useEffect(() => {
    setQuery(selectedChampion?.name ?? '')
  }, [selectedChampion?.name])

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-400/40"
        />
        {onClearChampion ? (
          <button
            type="button"
            onClick={() => {
              onClearChampion()
              setQuery('')
            }}
            className="rounded-2xl border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-slate-500 hover:bg-slate-900"
          >
            Clear
          </button>
        ) : null}
      </div>

      <div className="max-h-48 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950/60 p-2">
        {filteredOptions.length > 0 ? (
          <div className="space-y-1">
            {filteredOptions.map((option) => (
              <button
                key={`${role}-${option.id}`}
                type="button"
                onClick={() => {
                  onSelectChampion(option.id)
                  setQuery(option.name)
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
                  option.id === selectedChampionId
                    ? 'bg-cyan-400/15 text-cyan-200'
                    : 'text-slate-200 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <span>{option.name}</span>
                {option.id === selectedChampionId ? <span className="text-xs text-cyan-300">Selected</span> : null}
              </button>
            ))}
          </div>
        ) : (
          <p className="px-3 py-2 text-sm text-slate-400">No champion matches the current search.</p>
        )}
      </div>

      <p className="text-xs text-slate-500">
        Showing {filteredOptions.length} of {eligibleOptions.length} available champions
        {restrictToRole ? ` for ${role.toLowerCase()}` : ''}.
      </p>
    </div>
  )
}
