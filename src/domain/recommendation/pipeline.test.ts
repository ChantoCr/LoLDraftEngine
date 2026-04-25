import { describe, expect, it } from 'vitest'
import { supportChampionPoolFixture, supportLastPickAntiDiveScenario, testChampionMap } from '@/testing/fixtures/draftScenarios'
import { buildRecommendationPipeline } from '@/domain/recommendation/pipeline'

describe('buildRecommendationPipeline', () => {
  it('returns separate best-overall and personal-pool recommendation packages with downstream builds', () => {
    const pipeline = buildRecommendationPipeline({
      draftState: supportLastPickAntiDiveScenario,
      championsById: testChampionMap,
      championPool: supportChampionPoolFixture,
      topN: 3,
      buildTopN: 3,
    })

    expect(pipeline.bestOverall).toHaveLength(3)
    expect(pipeline.personalPool).toHaveLength(3)
    expect(pipeline.bestOverall[0]?.candidate.recommendationMode).toBe('BEST_OVERALL')
    expect(pipeline.personalPool[0]?.candidate.recommendationMode).toBe('PERSONAL_POOL')
    expect(pipeline.bestOverall[0]?.build?.recommendationMode).toBe('BEST_OVERALL')
    expect(pipeline.personalPool[0]?.build?.recommendationMode).toBe('PERSONAL_POOL')
    expect(pipeline.bestOverall[0]?.build?.corePath.length).toBeGreaterThan(0)
    expect(pipeline.personalPool[0]?.build?.starter).toBeDefined()
  })
})
