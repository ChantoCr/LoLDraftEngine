import type { ChampionPoolProfile } from '@/domain/champion-pool/types'
import { createDraftState } from '@/domain/draft/factories'

export const mockDraftState = createDraftState({
  patchVersion: '15.8',
  currentPickRole: 'SUPPORT',
  productMode: 'SOLO_QUEUE',
  recommendationMode: 'BEST_OVERALL',
  allyBans: ['irelia', 'lucian'],
  enemyBans: ['rell', 'poppy'],
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

export const mockChampionPoolProfile: ChampionPoolProfile = {
  playerLabel: 'Support Pool',
  role: 'SUPPORT',
  source: 'MANUAL',
  entries: [
    { championId: 'nautilus', tier: 'MAIN', masteryConfidence: 0.92 },
    { championId: 'braum', tier: 'COMFORT', masteryConfidence: 0.81 },
    { championId: 'leona', tier: 'PLAYABLE', masteryConfidence: 0.68 },
  ],
}
