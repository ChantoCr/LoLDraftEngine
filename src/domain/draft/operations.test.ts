import { describe, expect, it } from 'vitest'
import { addBan, assignChampionToSlot, clearChampionFromSlot } from '@/domain/draft/operations'
import { getDraftSlot, isChampionAvailable } from '@/domain/draft/selectors'
import { supportLastPickAntiDiveScenario } from '@/testing/fixtures/draftScenarios'

describe('draft operations', () => {
  it('assigns a champion to the open role and removes it from availability', () => {
    const nextDraftState = assignChampionToSlot(
      supportLastPickAntiDiveScenario,
      'ALLY',
      'SUPPORT',
      'braum',
    )

    expect(getDraftSlot(nextDraftState.allyTeam, 'SUPPORT')?.championId).toBe('braum')
    expect(nextDraftState.availableChampionIds).not.toContain('braum')
    expect(isChampionAvailable(nextDraftState, 'braum')).toBe(false)
  })

  it('clears an assigned champion and returns it to the available pool', () => {
    const lockedDraftState = assignChampionToSlot(
      supportLastPickAntiDiveScenario,
      'ALLY',
      'SUPPORT',
      'braum',
    )
    const clearedDraftState = clearChampionFromSlot(lockedDraftState, 'ALLY', 'SUPPORT')

    expect(getDraftSlot(clearedDraftState.allyTeam, 'SUPPORT')?.championId).toBeUndefined()
    expect(clearedDraftState.availableChampionIds).toContain('braum')
    expect(isChampionAvailable(clearedDraftState, 'braum')).toBe(true)
  })

  it('bans a champion by removing it from availability and future recommendation eligibility', () => {
    const bannedDraftState = addBan(supportLastPickAntiDiveScenario, 'ALLY', 'nautilus')

    expect(bannedDraftState.allyTeam.bans).toContain('nautilus')
    expect(bannedDraftState.availableChampionIds).not.toContain('nautilus')
    expect(isChampionAvailable(bannedDraftState, 'nautilus')).toBe(false)
  })
})
