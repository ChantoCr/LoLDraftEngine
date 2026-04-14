import { mockChampions } from '@/data/mock/champions'
import { createDraftState } from '@/domain/draft/factories'

const allChampionIds = mockChampions.map((champion) => champion.id)

export const mockLiveDraftTimeline = [
  createDraftState({
    patchVersion: '15.8',
    currentPickRole: 'JUNGLE',
    productMode: 'SOLO_QUEUE',
    recommendationMode: 'BEST_OVERALL',
    allyPicks: {
      TOP: { championId: 'aatrox', isLocked: true },
      MID: { championId: 'orianna', isLocked: true },
      ADC: { championId: 'jinx', isLocked: true },
      SUPPORT: { championId: 'braum', isLocked: true },
    },
    enemyPicks: {
      TOP: { championId: 'jayce', isLocked: true },
      MID: { championId: 'ahri', isLocked: true },
      ADC: { championId: 'xayah', isLocked: true },
      SUPPORT: { championId: 'rakan', isLocked: true },
    },
    availableChampionIds: allChampionIds,
  }),
  createDraftState({
    patchVersion: '15.8',
    currentPickRole: 'JUNGLE',
    productMode: 'SOLO_QUEUE',
    recommendationMode: 'BEST_OVERALL',
    allyPicks: {
      TOP: { championId: 'aatrox', isLocked: true },
      MID: { championId: 'orianna', isLocked: true },
      ADC: { championId: 'jinx', isLocked: true },
      SUPPORT: { championId: 'braum', isLocked: true },
      JUNGLE: { championId: 'sejuani', isLocked: true },
    },
    enemyPicks: {
      TOP: { championId: 'jayce', isLocked: true },
      MID: { championId: 'ahri', isLocked: true },
      ADC: { championId: 'xayah', isLocked: true },
      SUPPORT: { championId: 'rakan', isLocked: true },
    },
    availableChampionIds: allChampionIds,
  }),
  createDraftState({
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
    availableChampionIds: allChampionIds,
  }),
]
