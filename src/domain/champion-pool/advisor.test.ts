import { describe, expect, it } from 'vitest'
import { buildChampionPoolAdvice } from '@/domain/champion-pool/advisor'
import { analyzeDraftComposition } from '@/domain/composition/analyzer'
import { recommendChampionsForDraft } from '@/domain/recommendation/engine'
import {
  supportChampionPoolFixture,
  supportLastPickAntiDiveScenario,
  testChampionMap,
} from '@/testing/fixtures/draftScenarios'

describe('buildChampionPoolAdvice', () => {
  it('recommends taking the best in-pool answer when the gap is manageable', () => {
    const allyProfile = analyzeDraftComposition({
      draftState: supportLastPickAntiDiveScenario,
      championsById: testChampionMap,
      side: 'ALLY',
    })
    const bestOverall = recommendChampionsForDraft({
      draftState: supportLastPickAntiDiveScenario,
      championsById: testChampionMap,
      recommendationMode: 'BEST_OVERALL',
      topN: 1,
    })[0]
    const bestPool = recommendChampionsForDraft({
      draftState: supportLastPickAntiDiveScenario,
      championsById: testChampionMap,
      recommendationMode: 'PERSONAL_POOL',
      championPool: supportChampionPoolFixture,
      topN: 1,
    })[0]

    const advice = buildChampionPoolAdvice({
      role: 'SUPPORT',
      championPool: supportChampionPoolFixture,
      bestOverall,
      bestPool,
      allyProfile,
      championsById: testChampionMap,
    })

    expect(advice.decision).toBe('TAKE_BEST_POOL')
    expect(advice.rationale.length).toBeGreaterThan(0)
    expect(advice.bestPoolChampionId).toBeDefined()
  })
})
