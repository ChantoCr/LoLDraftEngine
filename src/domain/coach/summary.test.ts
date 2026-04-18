import { describe, expect, it } from 'vitest'
import { mockChampionMap } from '@/data/mock/champions'
import { createDraftState } from '@/domain/draft/factories'
import { analyzeDraftComposition } from '@/domain/composition/analyzer'
import { buildCoachSummary } from '@/domain/coach/summary'

describe('buildCoachSummary', () => {
  it('builds champion-specific execution guidance when the current ally role is already locked', () => {
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
    const compositionProfile = analyzeDraftComposition({ draftState, championsById: mockChampionMap })

    const summary = buildCoachSummary({
      draftState,
      championsById: mockChampionMap,
      compositionProfile,
      bestOverallLabel: 'Nautilus',
      bestPoolLabel: 'Braum',
    })

    expect(summary).toContain('On Braum SUPPORT')
    expect(summary).toContain('your job is to')
    expect(summary).toContain('As a team, you win by')
  })
})
