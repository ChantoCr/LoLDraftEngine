import { describe, expect, it } from 'vitest'
import { mapLcuChampSelectSessionToDraftState } from '@server/live/desktopClient/champSelectMapper'
import { recordedLcuChampSelectSessionFixture } from '@server/live/desktopClient/fixtures/recordedLcuChampSelectSession.fixture'

const championCatalog = [
  { championId: 'aatrox', riotChampionId: 266 },
  { championId: 'sejuani', riotChampionId: 113 },
  { championId: 'ahri', riotChampionId: 103 },
  { championId: 'jinx', riotChampionId: 222 },
  { championId: 'thresh', riotChampionId: 412 },
  { championId: 'garen', riotChampionId: 86 },
  { championId: 'leesin', riotChampionId: 64 },
  { championId: 'yasuo', riotChampionId: 157 },
  { championId: 'xayah', riotChampionId: 498 },
  { championId: 'rakan', riotChampionId: 497 },
  { championId: 'lucian', riotChampionId: 236 },
  { championId: 'vi', riotChampionId: 254 },
]

describe('recorded LCU fixture mapping', () => {
  it('maps a recorded-style champ-select payload into deterministic DraftState output', () => {
    const draftState = mapLcuChampSelectSessionToDraftState({
      session: recordedLcuChampSelectSessionFixture,
      patchVersion: '16.8.1',
      championCatalog,
    })

    expect(draftState.currentPickRole).toBe('SUPPORT')
    expect(draftState.allyTeam.bans).toEqual(['lucian'])
    expect(draftState.enemyTeam.bans).toEqual(['vi'])
    expect(draftState.allyTeam.picks[4]).toEqual({ role: 'SUPPORT', championId: 'thresh', isLocked: false })
    expect(draftState.enemyTeam.picks[0]).toEqual({ role: 'TOP', championId: 'garen', isLocked: true })
    expect(draftState.availableChampionIds).toEqual([])
  })
})
