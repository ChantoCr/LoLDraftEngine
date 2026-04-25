import { describe, expect, it } from 'vitest'
import { analyzeDraftComposition } from '@/domain/composition/analyzer'
import { buildDraftContext } from '@/domain/draft-context/build'
import {
  aatroxIntoJaycePokeScenario,
  lowEngageIntoPokeScenario,
  supportLastPickAntiDiveScenario,
  sustainAndFrontlineSupportScenario,
  testChampionMap,
  xayahIntoPokeThreatScenario,
} from '@/testing/fixtures/draftScenarios'

describe('buildDraftContext', () => {
  it('builds lane, mid-game, objective, and matchup danger guidance for anti-dive support scenarios', () => {
    const allyProfile = analyzeDraftComposition({
      draftState: supportLastPickAntiDiveScenario,
      championsById: testChampionMap,
      side: 'ALLY',
    })
    const enemyProfile = analyzeDraftComposition({
      draftState: supportLastPickAntiDiveScenario,
      championsById: testChampionMap,
      side: 'ENEMY',
    })

    const context = buildDraftContext({
      draftState: supportLastPickAntiDiveScenario,
      championsById: testChampionMap,
      allyProfile,
      enemyProfile,
    })

    expect(context.lanePhaseByRole.SUPPORT).toBeDefined()
    expect(context.midGame.summary.length).toBeGreaterThan(0)
    expect(context.objectives.summary.length).toBeGreaterThan(0)
    expect(context.matchupDangers.length).toBeGreaterThan(0)
    expect(context.matchupDangers.some((danger) => danger.role === 'ADC' || danger.role === 'SUPPORT')).toBe(true)
  })

  it('stays deterministic in low-engage into poke drafts and produces objective discipline guidance', () => {
    const allyProfile = analyzeDraftComposition({
      draftState: lowEngageIntoPokeScenario,
      championsById: testChampionMap,
      side: 'ALLY',
    })
    const enemyProfile = analyzeDraftComposition({
      draftState: lowEngageIntoPokeScenario,
      championsById: testChampionMap,
      side: 'ENEMY',
    })

    const context = buildDraftContext({
      draftState: lowEngageIntoPokeScenario,
      championsById: testChampionMap,
      allyProfile,
      enemyProfile,
    })

    expect(context.objectives.primaryCall).toBeDefined()
    expect(context.objectives.commonRisks.length).toBeGreaterThan(0)
    expect(context.midGame.avoid.length).toBeGreaterThan(0)
    expect(context.enemyThreatProfile.signals.some((signal) => signal.type === 'POKE')).toBe(true)
  })

  it('builds enemy threat signals for frontline and sustain-aware downstream build logic', () => {
    const allyProfile = analyzeDraftComposition({
      draftState: sustainAndFrontlineSupportScenario,
      championsById: testChampionMap,
      side: 'ALLY',
    })
    const enemyProfile = analyzeDraftComposition({
      draftState: sustainAndFrontlineSupportScenario,
      championsById: testChampionMap,
      side: 'ENEMY',
    })

    const context = buildDraftContext({
      draftState: sustainAndFrontlineSupportScenario,
      championsById: testChampionMap,
      allyProfile,
      enemyProfile,
    })

    expect(context.enemyThreatProfile.signals.some((signal) => signal.type === 'FRONTLINE')).toBe(true)
    expect(context.enemyThreatProfile.signals.some((signal) => signal.type === 'HEALING')).toBe(true)
    expect(context.enemyThreatProfile.frontlineDensity).toBeGreaterThan(2)
  })

  it('uses champion-specific threat overrides to surface stronger poke and pick signals in hostile lanes', () => {
    const allyProfile = analyzeDraftComposition({
      draftState: xayahIntoPokeThreatScenario,
      championsById: testChampionMap,
      side: 'ALLY',
    })
    const enemyProfile = analyzeDraftComposition({
      draftState: xayahIntoPokeThreatScenario,
      championsById: testChampionMap,
      side: 'ENEMY',
    })

    const context = buildDraftContext({
      draftState: xayahIntoPokeThreatScenario,
      championsById: testChampionMap,
      allyProfile,
      enemyProfile,
    })

    expect(context.enemyThreatProfile.signals.some((signal) => signal.type === 'POKE')).toBe(true)
    expect(context.enemyThreatProfile.signals.some((signal) => signal.type === 'PICK')).toBe(true)
  })

  it('keeps top-lane poke pressure visible for lane-aware build decisions', () => {
    const allyProfile = analyzeDraftComposition({
      draftState: aatroxIntoJaycePokeScenario,
      championsById: testChampionMap,
      side: 'ALLY',
    })
    const enemyProfile = analyzeDraftComposition({
      draftState: aatroxIntoJaycePokeScenario,
      championsById: testChampionMap,
      side: 'ENEMY',
    })

    const context = buildDraftContext({
      draftState: aatroxIntoJaycePokeScenario,
      championsById: testChampionMap,
      allyProfile,
      enemyProfile,
    })

    expect(context.lanePhaseByRole.TOP?.posture).toBe('STABILIZE')
    expect(context.enemyThreatProfile.signals.some((signal) => signal.type === 'POKE')).toBe(true)
  })
})
