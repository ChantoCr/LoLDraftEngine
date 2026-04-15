import { describe, expect, it, vi } from 'vitest'
import { createDDragonClient } from '@/data/providers/dDragon/client'
import { dDragonChampionCollectionFixture } from '@/testing/fixtures/stats/dDragon'

describe('createDDragonClient', () => {
  it('resolves short patch versions to the closest Data Dragon version', async () => {
    const fetcher = vi.fn(async (url: string) => {
      if (url.endsWith('/api/versions.json')) {
        return new Response(JSON.stringify(['15.8.1', '15.7.1']), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify(dDragonChampionCollectionFixture), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    })

    const client = createDDragonClient({ fetcher: fetcher as typeof fetch })
    await client.fetchChampionCollection({ patchVersion: '15.8' })

    expect(fetcher).toHaveBeenNthCalledWith(1, 'https://ddragon.leagueoflegends.com/api/versions.json')
    expect(fetcher).toHaveBeenNthCalledWith(
      2,
      'https://ddragon.leagueoflegends.com/cdn/15.8.1/data/en_US/champion.json',
    )
  })

  it('resolves the special latest patch token to the newest available Data Dragon version', async () => {
    const fetcher = vi.fn(async (url: string) => {
      if (url.endsWith('/api/versions.json')) {
        return new Response(JSON.stringify(['16.8.1', '16.7.1']), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify(dDragonChampionCollectionFixture), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    })

    const client = createDDragonClient({ fetcher: fetcher as typeof fetch })
    await client.fetchChampionCollection({ patchVersion: 'latest' })

    expect(fetcher).toHaveBeenNthCalledWith(1, 'https://ddragon.leagueoflegends.com/api/versions.json')
    expect(fetcher).toHaveBeenNthCalledWith(
      2,
      'https://ddragon.leagueoflegends.com/cdn/16.8.1/data/en_US/champion.json',
    )
  })
})
