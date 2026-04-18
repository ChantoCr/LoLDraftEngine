import type { LcuChampSelectSessionPayload } from '@server/live/desktopClient/champSelectMapper'

export const recordedLcuChampSelectSessionFixture: LcuChampSelectSessionPayload = {
  gameId: 998877,
  localPlayerCellId: 4,
  myTeam: [
    { cellId: 0, assignedPosition: 'top', championId: 266 },
    { cellId: 1, assignedPosition: 'jungle', championId: 113 },
    { cellId: 2, assignedPosition: 'middle', championId: 103 },
    { cellId: 3, assignedPosition: 'bottom', championId: 222 },
    { cellId: 4, assignedPosition: 'utility', championPickIntent: 412 },
  ],
  theirTeam: [
    { cellId: 5, assignedPosition: 'top', championId: 86 },
    { cellId: 6, assignedPosition: 'jungle', championId: 64 },
    { cellId: 7, assignedPosition: 'middle', championId: 157 },
    { cellId: 8, assignedPosition: 'bottom', championId: 498 },
    { cellId: 9, assignedPosition: 'utility', championId: 497 },
  ],
  actions: [
    [
      { id: 1, actorCellId: 0, championId: 236, completed: true, type: 'ban' },
      { id: 2, actorCellId: 5, championId: 254, completed: true, type: 'ban' },
    ],
    [
      { id: 3, actorCellId: 0, championId: 266, completed: true, type: 'pick' },
      { id: 4, actorCellId: 1, championId: 113, completed: true, type: 'pick' },
      { id: 5, actorCellId: 2, championId: 103, completed: true, type: 'pick' },
      { id: 6, actorCellId: 3, championId: 222, completed: true, type: 'pick' },
      { id: 7, actorCellId: 4, championId: 412, completed: false, isInProgress: true, type: 'pick' },
      { id: 8, actorCellId: 5, championId: 86, completed: true, type: 'pick' },
      { id: 9, actorCellId: 6, championId: 64, completed: true, type: 'pick' },
      { id: 10, actorCellId: 7, championId: 157, completed: true, type: 'pick' },
      { id: 11, actorCellId: 8, championId: 498, completed: true, type: 'pick' },
      { id: 12, actorCellId: 9, championId: 497, completed: true, type: 'pick' },
    ],
  ],
  timer: {
    phase: 'FINALIZATION',
    internalNowInEpochMs: 1713372000000,
  },
}
