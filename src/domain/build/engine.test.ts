import { describe, expect, it } from 'vitest'
import type { Champion } from '@/domain/champion/types'
import { defaultChampionBuildProfileRegistry } from '@/domain/build/profileRegistry'
import { recommendBuildForChampion } from '@/domain/build/engine'
import { buildRecommendationScenarioForChampion, recommendChampionsForDraft } from '@/domain/recommendation/engine'
import {
  aatroxIntoJaycePokeScenario,
  ahriIntoPickDiveScenario,
  supportLastPickAntiDiveScenario,
  sustainAndFrontlineSupportScenario,
  testChampionMap,
  xayahIntoPokeThreatScenario,
} from '@/testing/fixtures/draftScenarios'

function getTopRecommendationForScenario(draftState: typeof supportLastPickAntiDiveScenario) {
  const recommendation = recommendChampionsForDraft({
    draftState,
    championsById: testChampionMap,
    recommendationMode: 'BEST_OVERALL',
    topN: 1,
  })[0]!
  const champion = testChampionMap[recommendation.championId]!
  const scenario = buildRecommendationScenarioForChampion(champion, {
    draftState,
    championsById: testChampionMap,
  })
  const buildProfile = defaultChampionBuildProfileRegistry.getProfile({
    championId: champion.id,
    role: draftState.currentPickRole,
    patchVersion: draftState.patchVersion,
    champion,
  })

  return recommendBuildForChampion({
    recommendation,
    scenario,
    champion,
    buildProfile,
  })
}

function getSpecificBuildForScenario(draftState: typeof supportLastPickAntiDiveScenario, championId: string) {
  const recommendation = recommendChampionsForDraft({
    draftState,
    championsById: testChampionMap,
    recommendationMode: 'BEST_OVERALL',
    topN: 1,
  })[0]!
  const champion = testChampionMap[championId]!
  const scenario = buildRecommendationScenarioForChampion(champion, {
    draftState,
    championsById: testChampionMap,
  })
  const buildProfile = defaultChampionBuildProfileRegistry.getProfile({
    championId: champion.id,
    role: draftState.currentPickRole,
    patchVersion: draftState.patchVersion,
    champion,
  })

  return recommendBuildForChampion({
    recommendation: { ...recommendation, championId: champion.id, championName: champion.name },
    scenario,
    champion,
    buildProfile,
  })
}

describe('recommendBuildForChampion', () => {
  it('builds anti-dive support guidance for the top anti-dive recommendation', () => {
    const build = getTopRecommendationForScenario(supportLastPickAntiDiveScenario)

    expect(build.championId).toBe('braum')
    expect(build.starter?.items[0]?.itemName).toBe('World Atlas')
    expect(build.corePath.map((step) => step.items[0]?.itemName)).toContain("Locket of the Iron Solari")
    expect(build.adjustments.some((adjustment) => adjustment.trigger === 'HIGH_DIVE')).toBe(true)
    expect(build.explanation.headline.length).toBeGreaterThan(0)
  })

  it('adds anti-heal and anti-frontline branches when enemy threat signals justify them', () => {
    const build = getTopRecommendationForScenario(sustainAndFrontlineSupportScenario)

    expect(build.situationalBranches.some((branch) => branch.trigger === 'HIGH_HEALING')).toBe(true)
    expect(build.situationalBranches.some((branch) => branch.trigger === 'HIGH_FRONTLINE')).toBe(true)
    expect(build.dataQuality.championProfileSource).toBe('CURATED')
  })

  it('uses Ahri curated defensive branches into pick and dive pressure', () => {
    const build = getSpecificBuildForScenario(ahriIntoPickDiveScenario, 'ahri')

    expect(build.dataQuality.championProfileSource).toBe('CURATED')
    expect(build.firstBuy?.items.map((item) => item.itemName)).toEqual(["Seeker's Armguard", 'Boots'])
    expect(build.corePath.map((step) => step.items[0]?.itemName)).toContain("Zhonya's Hourglass")
    expect(build.situationalBranches.some((branch) => branch.trigger === 'HIGH_PICK')).toBe(true)
  })

  it('uses Xayah curated anti-poke and anti-dive guidance in hostile ADC boards', () => {
    const build = getSpecificBuildForScenario(xayahIntoPokeThreatScenario, 'xayah')

    expect(build.dataQuality.championProfileSource).toBe('CURATED')
    expect(build.starter?.items[0]?.itemName).toBe("Doran's Shield")
    expect(build.firstBuy?.items.map((item) => item.itemName)).toEqual(['Vampiric Scepter', 'Boots'])
    expect(build.situationalBranches.some((branch) => branch.trigger === 'HIGH_POKE')).toBe(true)
  })

  it('uses top-lane poke-aware first-buy guidance for Aatrox into Jayce pressure', () => {
    const build = getSpecificBuildForScenario(aatroxIntoJaycePokeScenario, 'aatrox')

    expect(build.dataQuality.championProfileSource).toBe('CURATED')
    expect(build.starter?.items[0]?.itemName).toBe("Doran's Shield")
    expect(build.firstBuy?.items.map((item) => item.itemName)).toEqual(['Vampiric Scepter', 'Boots'])
  })

  it('falls back to scaffolded build profiles for uncurated champions', () => {
    const genericChampion: Champion = {
      id: 'test-generic-support',
      name: 'Test Generic Support',
      roles: ['SUPPORT'],
      classes: ['CATCHER'],
      traits: {
        engage: 3,
        disengage: 2,
        peel: 2,
        poke: 1,
        scaling: 2,
        dive: 2,
        pick: 4,
        frontline: 1,
        damageProfile: 'MAGIC' as const,
      },
    }
    const recommendation = recommendChampionsForDraft({
      draftState: supportLastPickAntiDiveScenario,
      championsById: { ...testChampionMap, [genericChampion.id]: genericChampion },
      recommendationMode: 'BEST_OVERALL',
      topN: 1,
    })[0]!
    const scenario = buildRecommendationScenarioForChampion(genericChampion, {
      draftState: supportLastPickAntiDiveScenario,
      championsById: { ...testChampionMap, [genericChampion.id]: genericChampion },
    })
    const buildProfile = defaultChampionBuildProfileRegistry.getProfile({
      championId: genericChampion.id,
      role: 'SUPPORT',
      patchVersion: supportLastPickAntiDiveScenario.patchVersion,
      champion: genericChampion,
    })
    const build = recommendBuildForChampion({
      recommendation: {
        ...recommendation,
        championId: genericChampion.id,
        championName: genericChampion.name,
      },
      scenario,
      champion: genericChampion,
      buildProfile,
    })

    expect(build.dataQuality.championProfileSource).toBe('SCAFFOLDED')
    expect(build.confidence).toBe('low')
    expect(build.dataQuality.notes[0]).toContain('scaffolded')
  })
})
