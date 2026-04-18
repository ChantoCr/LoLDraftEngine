import { describe, expect, it } from 'vitest'
import { mapLcuChampSelectSessionToDraftState, type LcuChampSelectSessionPayload } from '@server/live/desktopClient/champSelectMapper'

const championCatalog = [
  { championId: 'aatrox', riotChampionId: 266 },
  { championId: 'vi', riotChampionId: 254 },
  { championId: 'ahri', riotChampionId: 103 },
  { championId: 'jinx', riotChampionId: 222 },
  { championId: 'thresh', riotChampionId: 412 },
  { championId: 'garen', riotChampionId: 86 },
  { championId: 'leesin', riotChampionId: 64 },
  { championId: 'yasuo', riotChampionId: 157 },
  { championId: 'xayah', riotChampionId: 498 },
  { championId: 'rakan', riotChampionId: 497 },
  { championId: 'sejuani', riotChampionId: 113 },
  { championId: 'lucian', riotChampionId: 236 },
]

describe('mapLcuChampSelectSessionToDraftState', () => {
  it('maps LCU champ-select picks, bans, availability, and local current role into DraftState', () => {
    const session: LcuChampSelectSessionPayload = {
      gameId: 123,
      localPlayerCellId: 2,
      myTeam: [
        { cellId: 0, assignedPosition: 'top', championId: 266 },
        { cellId: 1, assignedPosition: 'jungle', championId: 254 },
        { cellId: 2, assignedPosition: 'middle', championPickIntent: 103 },
        { cellId: 3, assignedPosition: 'bottom', championId: 222 },
        { cellId: 4, assignedPosition: 'utility', championId: 412 },
      ],
      theirTeam: [
        { cellId: 5, assignedPosition: 'top', championId: 86 },
        { cellId: 6, assignedPosition: 'jungle', championPickIntent: 64 },
        { cellId: 7, assignedPosition: 'middle', championId: 157 },
        { cellId: 8, assignedPosition: 'bottom', championId: 498 },
        { cellId: 9, assignedPosition: 'utility', championId: 497 },
      ],
      actions: [
        [
          { id: 1, actorCellId: 0, championId: 236, completed: true, type: 'ban' },
          { id: 2, actorCellId: 5, championId: 113, completed: true, type: 'ban' },
        ],
        [
          { id: 3, actorCellId: 0, championId: 266, completed: true, type: 'pick' },
          { id: 4, actorCellId: 1, championId: 254, completed: true, type: 'pick' },
          { id: 5, actorCellId: 2, championId: 103, completed: false, isInProgress: true, type: 'pick' },
          { id: 6, actorCellId: 3, championId: 222, completed: true, type: 'pick' },
          { id: 7, actorCellId: 4, championId: 412, completed: true, type: 'pick' },
          { id: 8, actorCellId: 5, championId: 86, completed: true, type: 'pick' },
          { id: 9, actorCellId: 6, championId: 64, completed: false, isInProgress: true, type: 'pick' },
          { id: 10, actorCellId: 7, championId: 157, completed: true, type: 'pick' },
          { id: 11, actorCellId: 8, championId: 498, completed: true, type: 'pick' },
          { id: 12, actorCellId: 9, championId: 497, completed: true, type: 'pick' },
        ],
      ],
    }

    const draftState = mapLcuChampSelectSessionToDraftState({
      session,
      patchVersion: '16.8.1',
      championCatalog,
    })

    expect(draftState.patchVersion).toBe('16.8.1')
    expect(draftState.currentPickRole).toBe('MID')
    expect(draftState.allyTeam.bans).toEqual(['lucian'])
    expect(draftState.enemyTeam.bans).toEqual(['sejuani'])
    expect(draftState.allyTeam.picks).toEqual([
      { role: 'TOP', championId: 'aatrox', isLocked: true },
      { role: 'JUNGLE', championId: 'vi', isLocked: true },
      { role: 'MID', championId: 'ahri', isLocked: false },
      { role: 'ADC', championId: 'jinx', isLocked: true },
      { role: 'SUPPORT', championId: 'thresh', isLocked: true },
    ])
    expect(draftState.enemyTeam.picks).toEqual([
      { role: 'TOP', championId: 'garen', isLocked: true },
      { role: 'JUNGLE', championId: 'leesin', isLocked: false },
      { role: 'MID', championId: 'yasuo', isLocked: true },
      { role: 'ADC', championId: 'xayah', isLocked: true },
      { role: 'SUPPORT', championId: 'rakan', isLocked: true },
    ])
    expect(draftState.availableChampionIds).toEqual([])
  })

  it('falls back to team order when assigned positions are missing or duplicated', () => {
    const session: LcuChampSelectSessionPayload = {
      localPlayerCellId: 1,
      myTeam: [
        { cellId: 0, assignedPosition: 'fill', championId: 266 },
        { cellId: 1, championId: 254 },
        { cellId: 2, assignedPosition: 'middle', championId: 103 },
        { cellId: 3, assignedPosition: 'middle', championId: 222 },
        { cellId: 4, championId: 412 },
      ],
      theirTeam: [],
      bans: {
        myTeamBans: [236],
      },
    }

    const draftState = mapLcuChampSelectSessionToDraftState({
      session,
      patchVersion: '16.8.1',
      championCatalog,
    })

    expect(draftState.currentPickRole).toBe('JUNGLE')
    expect(draftState.allyTeam.picks).toEqual([
      { role: 'TOP', championId: 'aatrox', isLocked: false },
      { role: 'JUNGLE', championId: 'vi', isLocked: false },
      { role: 'MID', championId: 'ahri', isLocked: false },
      { role: 'ADC', championId: 'jinx', isLocked: false },
      { role: 'SUPPORT', championId: 'thresh', isLocked: false },
    ])
    expect(draftState.allyTeam.bans).toEqual(['lucian'])
    expect(draftState.availableChampionIds).toEqual([
      'garen',
      'leesin',
      'yasuo',
      'xayah',
      'rakan',
      'sejuani',
    ])
  })
})
