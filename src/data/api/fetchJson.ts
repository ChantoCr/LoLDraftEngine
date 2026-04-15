function getMessageFromPayload(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return undefined
  }

  const candidate = payload as Record<string, unknown>
  const messageFields = ['error', 'message', 'details']

  for (const field of messageFields) {
    if (typeof candidate[field] === 'string' && candidate[field].trim().length > 0) {
      return candidate[field].trim()
    }
  }

  return undefined
}

async function readErrorMessage(response: Response, fallbackMessage: string) {
  const responseBody = await response.text()
  const trimmedBody = responseBody.trim()

  if (!trimmedBody) {
    return fallbackMessage
  }

  try {
    const payload = JSON.parse(trimmedBody) as unknown
    return getMessageFromPayload(payload) ?? trimmedBody
  } catch {
    return trimmedBody
  }
}

export async function fetchJson<TResponse>(url: string) {
  let response: Response

  try {
    response = await fetch(url)
  } catch (caughtError) {
    const message = caughtError instanceof Error ? caughtError.message : 'Unknown network error.'
    throw new Error(`Request failed for ${url}: ${message}`)
  }

  if (!response.ok) {
    const fallbackMessage = `Backend request failed: ${response.status} ${response.statusText}`
    const errorMessage = await readErrorMessage(response, fallbackMessage)
    throw new Error(errorMessage)
  }

  return (await response.json()) as TResponse
}
