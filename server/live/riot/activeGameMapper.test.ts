import { describe, expect, it } from 'vitest'
import { mapRiotActiveGameToDraftState, mapRiotActiveGameToDraftStateWithDebug } from '@server/live/riot/activeGameMapper'

const championCatalog = [
  { championId: 'aatrox', riotChampionId: 266, recommendedRoles: ['TOP'], classes: ['FIGHTER'] },
  { championId: 'sejuani', riotChampionId: 113, recommendedRoles: ['JUNGLE', 'TOP'], classes: ['TANK'] },
  { championId: 'ahri', riotChampionId: 103, recommendedRoles: ['MID'], classes: ['MAGE'] },
  { championId: 'jinx', riotChampionId: 222, recommendedRoles: ['ADC'], classes: ['MARKSMAN'] },
  { championId: 'thresh', riotChampionId: 412, recommendedRoles: ['SUPPORT'], classes: ['CATCHER'] },
  { championId: 'garen', riotChampionId: 86, recommendedRoles: ['TOP'], classes: ['FIGHTER'] },
  { championId: 'leesin', riotChampionId: 64, recommendedRoles: ['JUNGLE'], classes: ['FIGHTER'] },
  { championId: 'yasuo', riotChampionId: 157, recommendedRoles: ['MID', 'TOP'], classes: ['FIGHTER', 'ASSASSIN'] },
  { championId: 'xayah', riotChampionId: 498, recommendedRoles: ['ADC'], classes: ['MARKSMAN'] },
  { championId: 'rakan', riotChampionId: 497, recommendedRoles: ['SUPPORT'], classes: ['ENCHANTER', 'CATCHER'] },
  { championId: 'lucian', riotChampionId: 236, recommendedRoles: ['ADC', 'MID'], classes: ['MARKSMAN'] },
  { championId: 'vi', riotChampionId: 254, recommendedRoles: ['JUNGLE'], classes: ['FIGHTER'] },
]

describe('mapRiotActiveGameToDraftState', () => {
  it('maps a Riot active-game roster into deterministic DraftState output', () => {
    const draftState = mapRiotActiveGameToDraftState({
      patchVersion: '16.8.1',
      championCatalog,
      player: {
        account: { puuid: 'puuid-1', gameName: 'ParanormalGamer', tagLine: 'LAN' },
        summoner: { id: 'summoner-1', puuid: 'puuid-1', summonerLevel: 100, profileIconId: 1 },
        region: 'LAN',
        activeGame: {
          gameId: 123,
          gameQueueConfigId: 420,
          gameMode: 'CLASSIC',
          gameType: 'MATCHED_GAME',
          bannedChampions: [
            { championId: 236, teamId: 100 },
            { championId: 254, teamId: 200 },
          ],
          participants: [
            { teamId: 100, championId: 266, puuid: 'ally-top' },
            { teamId: 100, championId: 113, puuid: 'ally-jg' },
            { teamId: 100, championId: 103, puuid: 'ally-mid' },
            { teamId: 100, championId: 222, puuid: 'ally-adc' },
            { teamId: 100, championId: 412, puuid: 'puuid-1' },
            { teamId: 200, championId: 86, puuid: 'enemy-top' },
            { teamId: 200, championId: 64, puuid: 'enemy-jg' },
            { teamId: 200, championId: 157, puuid: 'enemy-mid' },
            { teamId: 200, championId: 498, puuid: 'enemy-adc' },
            { teamId: 200, championId: 497, puuid: 'enemy-sup' },
          ],
        },
      },
    })

    expect(draftState).toMatchObject({
      patchVersion: '16.8.1',
      productMode: 'SOLO_QUEUE',
      currentPickRole: 'SUPPORT',
      queueContext: {
        queueId: 420,
        queueType: 'RANKED_SOLO_DUO',
        label: 'Ranked Solo/Duo',
      },
      allyTeam: {
        bans: ['lucian'],
      },
      enemyTeam: {
        bans: ['vi'],
      },
    })
    expect(draftState?.allyTeam.picks[4]).toEqual({ role: 'SUPPORT', championId: 'thresh', isLocked: true })
    expect(draftState?.enemyTeam.picks[0]).toEqual({ role: 'TOP', championId: 'garen', isLocked: true })
    expect(draftState?.availableChampionIds).toEqual([])
  })

  it('uses heuristic role inference when Riot spectator participant order is shuffled', () => {
    const draftState = mapRiotActiveGameToDraftState({
      patchVersion: '16.8.1',
      championCatalog,
      player: {
        account: { puuid: 'puuid-1', gameName: 'ParanormalGamer', tagLine: 'LAN' },
        summoner: { id: 'summoner-1', puuid: 'puuid-1', summonerLevel: 100, profileIconId: 1 },
        region: 'LAN',
        activeGame: {
          gameId: 123,
          gameQueueConfigId: 440,
          gameMode: 'CLASSIC',
          gameType: 'MATCHED_GAME',
          participants: [
            { teamId: 100, championId: 222, puuid: 'ally-adc', spell1Id: 7, spell2Id: 4 },
            { teamId: 100, championId: 412, puuid: 'puuid-1', spell1Id: 3, spell2Id: 4 },
            { teamId: 100, championId: 103, puuid: 'ally-mid', spell1Id: 4, spell2Id: 14 },
            { teamId: 100, championId: 266, puuid: 'ally-top', spell1Id: 4, spell2Id: 12 },
            { teamId: 100, championId: 113, puuid: 'ally-jg', spell1Id: 11, spell2Id: 4 },
            { teamId: 200, championId: 497, puuid: 'enemy-sup', spell1Id: 3, spell2Id: 4 },
            { teamId: 200, championId: 498, puuid: 'enemy-adc', spell1Id: 7, spell2Id: 4 },
            { teamId: 200, championId: 157, puuid: 'enemy-mid', spell1Id: 4, spell2Id: 12 },
            { teamId: 200, championId: 64, puuid: 'enemy-jg', spell1Id: 11, spell2Id: 4 },
            { teamId: 200, championId: 86, puuid: 'enemy-top', spell1Id: 4, spell2Id: 12 },
          ],
        },
      },
    })

    expect(draftState?.currentPickRole).toBe('SUPPORT')
    expect(draftState?.productMode).toBe('CLASH')
    expect(draftState?.queueContext).toMatchObject({
      queueId: 440,
      queueType: 'RANKED_FLEX',
      label: 'Ranked Flex',
    })
    expect(draftState?.allyTeam.picks).toEqual([
      { role: 'TOP', championId: 'aatrox', isLocked: true },
      { role: 'JUNGLE', championId: 'sejuani', isLocked: true },
      { role: 'MID', championId: 'ahri', isLocked: true },
      { role: 'ADC', championId: 'jinx', isLocked: true },
      { role: 'SUPPORT', championId: 'thresh', isLocked: true },
    ])
    expect(draftState?.enemyTeam.picks).toEqual([
      { role: 'TOP', championId: 'garen', isLocked: true },
      { role: 'JUNGLE', championId: 'leesin', isLocked: true },
      { role: 'MID', championId: 'yasuo', isLocked: true },
      { role: 'ADC', championId: 'xayah', isLocked: true },
      { role: 'SUPPORT', championId: 'rakan', isLocked: true },
    ])
  })

  it('returns a structured failure reason when spectator champions cannot be resolved', () => {
    const result = mapRiotActiveGameToDraftStateWithDebug({
      patchVersion: '16.8.1',
      championCatalog: [],
      player: {
        account: { puuid: 'puuid-1', gameName: 'ParanormalGamer', tagLine: 'LAN' },
        summoner: { id: 'summoner-1', puuid: 'puuid-1', summonerLevel: 100, profileIconId: 1 },
        region: 'LAN',
        activeGame: {
          gameId: 123,
          gameQueueConfigId: 420,
          gameMode: 'CLASSIC',
          gameType: 'MATCHED_GAME',
          participants: [
            { teamId: 100, championId: 266, puuid: 'puuid-1' },
            { teamId: 200, championId: 86, puuid: 'enemy-top' },
          ],
        },
      },
    })

    expect(result).toMatchObject({
      participantCount: 2,
      mappedChampionCount: 0,
      failureReason: 'Riot spectator participants were found, but none of their champion ids resolved against the current champion catalog.',
    })
    expect(result.draftState).toBeUndefined()
  })
})
