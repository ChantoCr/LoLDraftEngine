import { describe, expect, it } from 'vitest'
import { formatDevProxyError } from '@server/dev/formatProxyError'

describe('formatDevProxyError', () => {
  it('includes the proxied path, aggregate label, nested error codes, and stack', () => {
    const connectError = Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:3001'), {
      code: 'ECONNREFUSED',
    })
    const aggregateError = new AggregateError([connectError], 'All connection attempts failed')

    const message = formatDevProxyError('/api/stats/patch/15.8/catalog', aggregateError)

    expect(message).toContain('ProxyError /api/stats/patch/15.8/catalog')
    expect(message).toContain('AggregateError ECONNREFUSED')
    expect(message).toContain('All connection attempts failed')
  })
})
