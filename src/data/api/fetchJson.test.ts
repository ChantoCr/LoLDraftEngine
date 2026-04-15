import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchJson } from '@/data/api/fetchJson'

describe('fetchJson', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns parsed JSON for successful responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ patchVersion: '15.8' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    await expect(fetchJson<{ patchVersion: string }>('/api/stats/patch/15.8/bundle')).resolves.toEqual({
      patchVersion: '15.8',
    })
  })

  it('surfaces structured proxy error messages from backend responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          error:
            'ProxyError /api/stats/patch/15.8/catalog\nAggregateError ECONNREFUSED\nat internalConnectMultiple (node:net:1134:18)',
        }),
        {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    )

    await expect(fetchJson('/api/stats/patch/15.8/catalog')).rejects.toThrow(
      'ProxyError /api/stats/patch/15.8/catalog',
    )
  })

  it('falls back to raw response text when error payload is not json', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('ProxyError /api/stats/patch/15.8/catalog\nAggregateError ECONNREFUSED', {
        status: 502,
      }),
    )

    await expect(fetchJson('/api/stats/patch/15.8/catalog')).rejects.toThrow('AggregateError ECONNREFUSED')
  })

  it('wraps thrown network errors with request context', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(fetchJson('/api/stats/patch/15.8/catalog')).rejects.toThrow(
      'Request failed for /api/stats/patch/15.8/catalog: Failed to fetch',
    )
  })
})
