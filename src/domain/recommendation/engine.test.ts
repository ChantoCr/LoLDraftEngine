import { describe, expect, it } from 'vitest'
import { mockStatsBundle } from '@/data/mock/stats'
import { addBan } from '@/domain/draft/operations'
import { recommendChampionsForDraft } from '@/domain/recommendation/engine'
import {
  supportChampionPoolFixture,
  supportLastPickAntiDiveScenario,
  testChampionMap,
  wrongRoleChampionPoolFixture,
} from '@/testing/fixtures/draftScenarios'

function getDimensionScore(
  candidate: NonNullable<ReturnType<typeof recommendChampionsForDraft>[number]>,
  dimension: string,
) {
  return candidate.breakdown.dimensions.find((entry) => entry.dimension === dimension)?.score ?? 0
}

describe('recommendChampionsForDraft', () => {
  it('preserves best-overall ranking order for the anti-dive support scenario', () => {
    const recommendations = recommendChampionsForDraft({
      draftState: supportLastPickAntiDiveScenario,
      championsById: testChampionMap,
      recommendationMode: 'BEST_OVERALL',
      topN: 4,
    })

    expect(recommendations.map((candidate) => candidate.championId)).toEqual([
      'braum',
      'nautilus',
      'leona',
      'renata',
    ])
    expect(recommendations[0]?.breakdown.reasons.some((reason) => reason.type === 'REPAIR')).toBe(true)
  })

  it('preserves personal-pool ranking order and excludes out-of-pool champions', () => {
    const recommendations = recommendChampionsForDraft({
      draftState: supportLastPickAntiDiveScenario,
      championsById: testChampionMap,
      recommendationMode: 'PERSONAL_POOL',
      championPool: supportChampionPoolFixture,
      topN: 4,
    })

    expect(recommendations.map((candidate) => candidate.championId)).toEqual(['braum', 'nautilus', 'leona'])
    expect(recommendations.every((candidate) => candidate.tags.includes('Inside pool'))).toBe(true)
  })

  it('returns no personal-pool recommendations when the pool role does not match the draft role', () => {
    const recommendations = recommendChampionsForDraft({
      draftState: supportLastPickAntiDiveScenario,
      championsById: testChampionMap,
      recommendationMode: 'PERSONAL_POOL',
      championPool: wrongRoleChampionPoolFixture,
    })

    expect(recommendations).toEqual([])
  })

  it('excludes banned champions even if they are present in the personal pool', () => {
    const bannedDraftState = addBan(supportLastPickAntiDiveScenario, 'ALLY', 'nautilus')

    const recommendations = recommendChampionsForDraft({
      draftState: bannedDraftState,
      championsById: testChampionMap,
      recommendationMode: 'PERSONAL_POOL',
      championPool: supportChampionPoolFixture,
      topN: 4,
    })

    expect(recommendations.map((candidate) => candidate.championId)).toEqual(['braum', 'leona'])
  })

  it('adds draft-context dimensions and reasons so recommendations explain lane, macro, and objective fit', () => {
    const recommendations = recommendChampionsForDraft({
      draftState: supportLastPickAntiDiveScenario,
      championsById: testChampionMap,
      recommendationMode: 'BEST_OVERALL',
      topN: 2,
    })

    const topCandidate = recommendations[0]!

    expect(topCandidate.breakdown.dimensions.some((dimension) => dimension.dimension === 'laneMatchupFit')).toBe(true)
    expect(topCandidate.breakdown.dimensions.some((dimension) => dimension.dimension === 'objectiveSetupFit')).toBe(true)
    expect(topCandidate.breakdown.dimensions.some((dimension) => dimension.dimension === 'macroPostureFit')).toBe(true)
    expect(
      topCandidate.breakdown.reasons.some((reason) => ['LANE', 'OBJECTIVE', 'POSTURE'].includes(reason.type)),
    ).toBe(true)
  })

  it('blends structured stats signals into synergy, counter, and meta scoring without removing deterministic behavior', () => {
    const withoutStats = recommendChampionsForDraft({
      draftState: supportLastPickAntiDiveScenario,
      championsById: testChampionMap,
      recommendationMode: 'BEST_OVERALL',
      topN: 4,
    })
    const withStats = recommendChampionsForDraft({
      draftState: supportLastPickAntiDiveScenario,
      championsById: testChampionMap,
      recommendationMode: 'BEST_OVERALL',
      statsBundle: mockStatsBundle,
      topN: 4,
    })

    expect(withStats[0]?.championId).toBe('braum')
    expect(getDimensionScore(withStats[0]!, 'enemyCounter')).not.toBe(
      getDimensionScore(withoutStats[0]!, 'enemyCounter'),
    )
    expect(getDimensionScore(withStats[0]!, 'metaValue')).toBeGreaterThanOrEqual(
      getDimensionScore(withoutStats[0]!, 'metaValue'),
    )
    expect(withStats[0]?.breakdown.reasons.some((reason) => reason.type === 'META' || reason.id.includes('stats'))).toBe(
      true,
    )
  })
})
