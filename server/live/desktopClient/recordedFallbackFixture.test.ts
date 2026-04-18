import { describe, expect, it } from 'vitest'
import { mapLcuChampSelectSessionToDraftState } from '@server/live/desktopClient/champSelectMapper'
import { recordedLcuFallbackBansFixture } from '@server/live/desktopClient/fixtures/recordedLcuFallbackBans.fixture'

const championCatalog = [
  { championId: 'aatrox', riotChampionId: 266 },
  { championId: 'vi', riotChampionId: 254 },
  { championId: 'ahri', riotChampionId: 103 },
  { championId: 'jinx', riotChampionId: 222 },
  { championId: 'thresh', riotChampionId: 412 },
  { championId: 'garen', riotChampionId: 86 },
  { championId: 'leesin', riotChampionId: 64 },
  { championId: 'lucian', riotChampionId: 236 },
  { championId: 'sejuani', riotChampionId: 113 },
]

describe('recorded fallback LCU fixture mapping', () => {
  it('maps fallback ban arrays and missing assigned positions into deterministic draft output', () => {
    const draftState = mapLcuChampSelectSessionToDraftState({
      session: recordedLcuFallbackBansFixture,
      patchVersion: '16.8.1',
      championCatalog,
    })

    expect(draftState.currentPickRole).toBe('JUNGLE')
    expect(draftState.allyTeam.bans).toEqual(['lucian'])
    expect(draftState.enemyTeam.bans).toEqual(['sejuani'])
    expect(draftState.allyTeam.picks[1]).toEqual({ role: 'JUNGLE', championId: 'vi', isLocked: false })
    expect(draftState.enemyTeam.picks[0]).toEqual({ role: 'TOP', championId: 'garen', isLocked: false })
  })
})
