import { describe, expect, it } from 'vitest'
import { analyzeDraftComposition } from '@/domain/composition/analyzer'
import {
  adHeavyThinFrontlineScenario,
  lowEngageIntoPokeScenario,
  supportLastPickAntiDiveScenario,
  testChampionMap,
} from '@/testing/fixtures/draftScenarios'

describe('analyzeDraftComposition', () => {
  it('detects front-to-back engage scaling shell with anti-dive gaps', () => {
    const profile = analyzeDraftComposition({
      draftState: supportLastPickAntiDiveScenario,
      championsById: testChampionMap,
    })

    expect(profile.archetypes).toEqual(expect.arrayContaining(['FRONT_TO_BACK', 'ENGAGE', 'SCALING']))
    expect(profile.damageProfile.leaning).toBe('BALANCED')
    expect(profile.structuralGaps).toEqual(expect.arrayContaining(['Backline peel', 'Anti-dive peel']))
    expect(profile.alerts.map((alert) => alert.id)).toContain('anti-dive-peel')
    expect(profile.executionDifficulty).toBe('HIGH')
  })

  it('flags AD-heavy drafts with insufficient frontline and damage balance issues', () => {
    const profile = analyzeDraftComposition({
      draftState: adHeavyThinFrontlineScenario,
      championsById: testChampionMap,
    })

    expect(profile.damageProfile.leaning).toBe('AD_HEAVY')
    expect(profile.structuralGaps).toEqual(
      expect.arrayContaining(['Reliable frontline', 'Backline peel', 'Magic damage balance']),
    )
    expect(profile.weaknesses).toContain(
      'The current draft leans too physical and risks becoming easy to itemize against.',
    )
  })

  it('detects when a low-engage draft lacks access into ranged poke setups', () => {
    const profile = analyzeDraftComposition({
      draftState: lowEngageIntoPokeScenario,
      championsById: testChampionMap,
    })

    expect(profile.averageTraits.engage).toBeLessThan(2.1)
    expect(profile.structuralGaps).toContain('Reliable access into ranged setups')
    expect(profile.winConditions.length).toBeGreaterThan(0)
  })
})
