import { describe, expect, it } from 'vitest'
import {
  createPlaceholderRoleConfidence,
  normalizeDDragonChampionCollection,
} from '@/data/providers/dDragon/normalize'
import { dDragonChampionCollectionFixture } from '@/testing/fixtures/stats/dDragon'

describe('normalizeDDragonChampionCollection', () => {
  it('normalizes Data Dragon champion payloads into internal champion records', () => {
    const champions = normalizeDDragonChampionCollection(dDragonChampionCollectionFixture, {
      patchVersion: '15.8',
      fetchedAt: '2026-04-13T18:30:00.000Z',
      source: 'FIXTURE',
    })

    expect(champions).toHaveLength(2)
    expect(champions.map((champion) => champion.id)).toEqual(['braum', 'nautilus'])
    expect(champions[0]).toMatchObject({
      id: 'braum',
      patchVersion: '15.8',
      source: 'FIXTURE',
      classes: ['ENCHANTER', 'TANK'],
      resource: 'Mana',
      rolePerformances: [],
    })
    expect(champions[0]?.image.square).toBe(
      'https://ddragon.leagueoflegends.com/cdn/15.8/img/champion/Braum.png',
    )
    expect(champions[0]?.freshness.fetchedAt).toBe('2026-04-13T18:30:00.000Z')
  })

  it('creates an explicit placeholder confidence signal for missing role stats', () => {
    const confidence = createPlaceholderRoleConfidence()

    expect(confidence.level).toBe('low')
    expect(confidence.reasons[0]).toContain('Data Dragon does not provide role win-rate')
  })
})
