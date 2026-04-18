import type { LcuChampSelectSessionPayload } from '@server/live/desktopClient/champSelectMapper'

export const recordedLcuFallbackBansFixture: LcuChampSelectSessionPayload = {
  gameId: 445566,
  localPlayerCellId: 1,
  myTeam: [
    { cellId: 0, assignedPosition: 'top', championId: 266 },
    { cellId: 1, championPickIntent: 254 },
    { cellId: 2, assignedPosition: 'middle', championId: 103 },
    { cellId: 3, assignedPosition: 'bottom', championId: 222 },
    { cellId: 4, assignedPosition: 'utility', championId: 412 },
  ],
  theirTeam: [
    { cellId: 5, championId: 86 },
    { cellId: 6, championPickIntent: 64 },
  ],
  bans: {
    myTeamBans: [236],
    theirTeamBans: [113],
  },
  timer: {
    phase: 'BAN_PICK',
    internalNowInEpochMs: 1713372600000,
  },
}
