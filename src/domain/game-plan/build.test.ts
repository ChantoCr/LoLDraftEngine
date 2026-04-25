import { describe, expect, it } from 'vitest'
import { mockChampionMap } from '@/data/mock/champions'
import { analyzeDraftComposition } from '@/domain/composition/analyzer'
import { createDraftState } from '@/domain/draft/factories'
import { buildLiveGamePlan } from '@/domain/game-plan/build'

describe('buildLiveGamePlan', () => {
  it('produces a deterministic live game plan from the current board state', () => {
    const draftState = createDraftState({
      patchVersion: '16.8.1',
      currentPickRole: 'SUPPORT',
      allyPicks: {
        TOP: { championId: 'aatrox', isLocked: true },
        JUNGLE: { championId: 'sejuani', isLocked: true },
        MID: { championId: 'orianna', isLocked: true },
        ADC: { championId: 'jinx', isLocked: true },
        SUPPORT: { championId: 'braum', isLocked: true },
      },
      enemyPicks: {
        TOP: { championId: 'jayce', isLocked: true },
        JUNGLE: { championId: 'vi', isLocked: true },
        MID: { championId: 'ahri', isLocked: true },
        ADC: { championId: 'xayah', isLocked: true },
        SUPPORT: { championId: 'rakan', isLocked: true },
      },
      availableChampionIds: [],
    })

    const allyProfile = analyzeDraftComposition({ draftState, championsById: mockChampionMap, side: 'ALLY' })
    const enemyProfile = analyzeDraftComposition({ draftState, championsById: mockChampionMap, side: 'ENEMY' })
    const gamePlan = buildLiveGamePlan({
      draftState,
      championsById: mockChampionMap,
      allyProfile,
      enemyProfile,
    })

    expect(gamePlan.playerRole).toBe('SUPPORT')
    expect(gamePlan.playerChampionName).toBe('Braum')
    expect(gamePlan.playerJob).toContain('Braum should')
    expect(gamePlan.allyIdentity.length).toBeGreaterThan(0)
    expect(gamePlan.enemyIdentity.length).toBeGreaterThan(0)
    expect(gamePlan.practicalRules.length).toBeGreaterThan(0)
    expect(gamePlan.lanePhase?.summary).toBeDefined()
    expect(gamePlan.midGame.summary.length).toBeGreaterThan(0)
    expect(gamePlan.objectives.summary.length).toBeGreaterThan(0)
    expect(gamePlan.matchupDangers.length).toBeGreaterThan(0)
  })
})
