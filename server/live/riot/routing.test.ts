import { describe, expect, it } from 'vitest'
import { getRiotRegionRouting } from '@server/live/riot/routing'

describe('getRiotRegionRouting', () => {
  it('maps LAN and Americas regions to the americas routing cluster', () => {
    expect(getRiotRegionRouting('LAN')).toMatchObject({ regionalCluster: 'americas', platformId: 'la1' })
    expect(getRiotRegionRouting('LAS')).toMatchObject({ regionalCluster: 'americas', platformId: 'la2' })
    expect(getRiotRegionRouting('NA')).toMatchObject({ regionalCluster: 'americas', platformId: 'na1' })
  })

  it('maps Europe, Asia, and SEA regions to their expected routing clusters', () => {
    expect(getRiotRegionRouting('EUW')).toMatchObject({ regionalCluster: 'europe', platformId: 'euw1' })
    expect(getRiotRegionRouting('KR')).toMatchObject({ regionalCluster: 'asia', platformId: 'kr' })
    expect(getRiotRegionRouting('PH')).toMatchObject({ regionalCluster: 'sea', platformId: 'ph2' })
  })
})
