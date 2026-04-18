import { describe, expect, it, vi } from 'vitest'
import {
  buildLcuAuthorizationHeader,
  buildLcuBaseUrl,
  createLcuPollingDraftSource,
  fetchLcuChampSelectSession,
} from '@server/live/desktopClient/lcuAdapter'

const championCatalog = [
  { championId: 'aatrox', riotChampionId: 266 },
  { championId: 'ahri', riotChampionId: 103 },
]

describe('lcuAdapter', () => {
  it('builds the expected LCU base url and authorization header', () => {
    expect(buildLcuBaseUrl({ protocol: 'https', host: '127.0.0.1', port: 2999, password: 'secret' })).toBe(
      'https://127.0.0.1:2999',
    )
    expect(buildLcuAuthorizationHeader({ username: 'riot', password: 'secret' })).toBe('Basic cmlvdDpzZWNyZXQ=')
  })

  it('treats 404 and 409 responses as no active champ-select session', async () => {
    const fetcher404 = vi.fn().mockResolvedValue(new Response(null, { status: 404 }))
    const fetcher409 = vi.fn().mockResolvedValue(new Response(null, { status: 409 }))

    await expect(
      fetchLcuChampSelectSession({
        credentials: { port: 2999, password: 'secret' },
        fetcher: fetcher404 as typeof fetch,
      }),
    ).resolves.toBeUndefined()

    await expect(
      fetchLcuChampSelectSession({
        credentials: { port: 2999, password: 'secret' },
        fetcher: fetcher409 as typeof fetch,
      }),
    ).resolves.toBeUndefined()
  })

  it('can read the champ-select session through the native requester path', async () => {
    const requester = vi.fn().mockResolvedValue({
      status: 200,
      statusText: 'OK',
      bodyText: JSON.stringify({
        gameId: 888,
        localPlayerCellId: 1,
        myTeam: [{ cellId: 1, assignedPosition: 'middle', championPickIntent: 103 }],
        theirTeam: [],
      }),
    })

    await expect(
      fetchLcuChampSelectSession({
        credentials: { port: 2999, password: 'secret' },
        requester,
      }),
    ).resolves.toMatchObject({
      gameId: 888,
      localPlayerCellId: 1,
    })

    expect(requester).toHaveBeenCalledWith({
      credentials: { port: 2999, password: 'secret' },
      endpointPath: '/lol-champ-select/v1/session',
    })
  })

  it('creates an LCU polling source that maps the fetched session into DraftState', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          gameId: 777,
          localPlayerCellId: 1,
          myTeam: [
            { cellId: 0, assignedPosition: 'top', championId: 266 },
            { cellId: 1, assignedPosition: 'middle', championPickIntent: 103 },
          ],
          theirTeam: [],
          actions: [[{ id: 1, actorCellId: 0, championId: 266, completed: true, type: 'pick' }]],
          timer: { phase: 'BAN_PICK', internalNowInEpochMs: 123456 },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    )

    const source = createLcuPollingDraftSource({
      credentials: { port: 2999, password: 'secret' },
      patchVersion: '16.8.1',
      championCatalog,
      fetcher: fetcher as typeof fetch,
      now: () => '2026-04-17T01:00:00.000Z',
    })

    const snapshot = await source.readSnapshot()

    expect(fetcher).toHaveBeenCalledWith('https://127.0.0.1:2999/lol-champ-select/v1/session', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: 'Basic cmlvdDpzZWNyZXQ=',
      },
    })
    expect(snapshot).toMatchObject({
      kind: 'LCU',
      status: 'active',
      observedAt: '2026-04-17T01:00:00.000Z',
      sourceEventId: '777:BAN_PICK:123456',
      draftState: {
        patchVersion: '16.8.1',
        currentPickRole: 'MID',
      },
    })
    expect(snapshot?.draftState?.allyTeam.picks[0]).toEqual({ role: 'TOP', championId: 'aatrox', isLocked: true })
    expect(snapshot?.draftState?.allyTeam.picks[2]).toEqual({ role: 'MID', championId: 'ahri', isLocked: false })
  })

  it('returns an unavailable snapshot when the LCU session endpoint is idle', async () => {
    const source = createLcuPollingDraftSource({
      credentials: { port: 2999, password: 'secret' },
      patchVersion: '16.8.1',
      championCatalog,
      fetcher: vi.fn().mockResolvedValue(new Response(null, { status: 404 })) as typeof fetch,
      now: () => '2026-04-17T01:05:00.000Z',
    })

    await expect(source.readSnapshot()).resolves.toEqual({
      kind: 'LCU',
      status: 'unavailable',
      observedAt: '2026-04-17T01:05:00.000Z',
      message: 'LCU champ-select session is not currently available.',
    })
  })
})
