import type { ChampionPoolProfile } from '@/domain/champion-pool/types'
import { createDraftState } from '@/domain/draft/factories'
import { mockChampionMap } from '@/data/mock/champions'

export const testChampionMap = mockChampionMap

export const supportChampionPoolFixture: ChampionPoolProfile = {
  playerLabel: 'Support Test Pool',
  role: 'SUPPORT',
  entries: [
    { championId: 'nautilus', tier: 'MAIN', masteryConfidence: 0.92 },
    { championId: 'braum', tier: 'COMFORT', masteryConfidence: 0.81 },
    { championId: 'leona', tier: 'PLAYABLE', masteryConfidence: 0.68 },
  ],
}

export const supportLastPickAntiDiveScenario = createDraftState({
  patchVersion: '15.8',
  currentPickRole: 'SUPPORT',
  productMode: 'SOLO_QUEUE',
  recommendationMode: 'BEST_OVERALL',
  allyPicks: {
    TOP: { championId: 'aatrox', isLocked: true },
    JUNGLE: { championId: 'sejuani', isLocked: true },
    MID: { championId: 'orianna', isLocked: true },
    ADC: { championId: 'jinx', isLocked: true },
  },
  enemyPicks: {
    TOP: { championId: 'jayce', isLocked: true },
    JUNGLE: { championId: 'vi', isLocked: true },
    MID: { championId: 'ahri', isLocked: true },
    ADC: { championId: 'xayah', isLocked: true },
    SUPPORT: { championId: 'rakan', isLocked: true },
  },
  availableChampionIds: ['nautilus', 'leona', 'braum', 'renata'],
})

export const adHeavyThinFrontlineScenario = createDraftState({
  patchVersion: '15.8',
  currentPickRole: 'SUPPORT',
  productMode: 'SOLO_QUEUE',
  recommendationMode: 'BEST_OVERALL',
  allyPicks: {
    TOP: { championId: 'aatrox', isLocked: true },
    JUNGLE: { championId: 'vi', isLocked: true },
    MID: { championId: 'jayce', isLocked: true },
    ADC: { championId: 'xayah', isLocked: true },
  },
  enemyPicks: {
    TOP: { championId: 'sejuani', isLocked: true },
    JUNGLE: { championId: 'orianna', isLocked: true },
    MID: { championId: 'ahri', isLocked: true },
    ADC: { championId: 'jinx', isLocked: true },
    SUPPORT: { championId: 'braum', isLocked: true },
  },
  availableChampionIds: ['nautilus', 'leona', 'braum', 'renata'],
})

export const lowEngageIntoPokeScenario = createDraftState({
  patchVersion: '15.8',
  currentPickRole: 'JUNGLE',
  productMode: 'COMPETITIVE',
  recommendationMode: 'BEST_OVERALL',
  allyPicks: {
    TOP: { championId: 'jayce', isLocked: true },
    MID: { championId: 'orianna', isLocked: true },
    ADC: { championId: 'xayah', isLocked: true },
    SUPPORT: { championId: 'renata', isLocked: true },
  },
  enemyPicks: {
    TOP: { championId: 'jayce', isLocked: true },
    JUNGLE: { championId: 'orianna', isLocked: true },
    MID: { championId: 'ahri', isLocked: true },
    ADC: { championId: 'xayah', isLocked: true },
    SUPPORT: { championId: 'renata', isLocked: true },
  },
  availableChampionIds: ['sejuani', 'vi'],
})

export const wrongRoleChampionPoolFixture: ChampionPoolProfile = {
  playerLabel: 'Top Test Pool',
  role: 'TOP',
  entries: [{ championId: 'aatrox', tier: 'MAIN', masteryConfidence: 0.9 }],
}
