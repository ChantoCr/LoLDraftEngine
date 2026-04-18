type ErrorWithCode = Error & {
  code?: string
  errors?: unknown[]
}

function collectErrorCodes(error: unknown): string[] {
  if (!error || typeof error !== 'object') {
    return []
  }

  const candidate = error as ErrorWithCode
  const directCode = typeof candidate.code === 'string' ? [candidate.code] : []
  const nestedCodes = Array.isArray(candidate.errors) ? candidate.errors.flatMap(collectErrorCodes) : []

  return [...new Set([...directCode, ...nestedCodes])]
}

function buildErrorSummary(error: unknown) {
  if (error instanceof AggregateError) {
    const codes = collectErrorCodes(error)
    return ['AggregateError', ...codes].filter(Boolean).join(' ')
  }

  if (error instanceof Error) {
    const candidate = error as ErrorWithCode
    return [candidate.name, candidate.code].filter(Boolean).join(' ')
  }

  return 'UnknownProxyError'
}

export function formatDevProxyError(path: string, error: unknown) {
  const lines = [`ProxyError ${path}`, buildErrorSummary(error)]
  const errorCodes = collectErrorCodes(error)

  if (errorCodes.includes('ECONNREFUSED')) {
    lines.push('The local backend companion is not reachable. Start `npm run server:dev` and retry.')
  }

  if (error instanceof Error && error.stack?.trim()) {
    lines.push(error.stack.trim())
  } else if (error != null) {
    lines.push(String(error))
  }

  return lines.filter((line) => line.trim().length > 0).join('\n')
}
