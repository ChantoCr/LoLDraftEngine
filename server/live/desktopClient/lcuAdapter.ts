import http from 'node:http'
import https from 'node:https'
import type { ProductMode, RecommendationMode } from '@/domain/draft/types'
import { mapLcuChampSelectSessionToDraftState, type LcuChampSelectSessionPayload } from '@server/live/desktopClient/champSelectMapper'
import type {
  DesktopChampionCatalogEntry,
  DesktopCompanionDraftSource,
  DesktopCompanionSourceSnapshot,
} from '@server/live/desktopClient/source'

export interface LcuConnectionCredentials {
  port: number
  password: string
  host?: string
  protocol?: 'https' | 'http'
  username?: string
}

export interface LcuRawResponse {
  status: number
  statusText?: string
  bodyText: string
}

export type LcuHttpRequester = (input: {
  credentials: LcuConnectionCredentials
  endpointPath: string
}) => Promise<LcuRawResponse>

interface FetchLcuChampSelectSessionInput {
  credentials: LcuConnectionCredentials
  endpointPath?: string
  fetcher?: typeof fetch
  requester?: LcuHttpRequester
}

interface CreateLcuPollingDraftSourceInput {
  credentials: LcuConnectionCredentials
  patchVersion: string
  championCatalog: DesktopChampionCatalogEntry[]
  productMode?: ProductMode
  recommendationMode?: RecommendationMode
  fetcher?: typeof fetch
  requester?: LcuHttpRequester
  now?: () => string
}

export function buildLcuBaseUrl({ protocol = 'https', host = '127.0.0.1', port }: LcuConnectionCredentials) {
  return `${protocol}://${host}:${port}`
}

export function buildLcuAuthorizationHeader({ username = 'riot', password }: Pick<LcuConnectionCredentials, 'username' | 'password'>) {
  return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
}

export function createNodeLcuHttpRequester(): LcuHttpRequester {
  return ({ credentials, endpointPath }) => {
    const transport = credentials.protocol === 'http' ? http : https

    return new Promise((resolve, reject) => {
      const request = transport.request(
        {
          hostname: credentials.host ?? '127.0.0.1',
          port: credentials.port,
          path: endpointPath,
          method: 'GET',
          rejectUnauthorized: credentials.protocol !== 'http' ? false : undefined,
          headers: {
            Accept: 'application/json',
            Authorization: buildLcuAuthorizationHeader(credentials),
          },
        },
        (response) => {
          const chunks: Buffer[] = []

          response.on('data', (chunk) => {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
          })
          response.on('end', () => {
            resolve({
              status: response.statusCode ?? 0,
              statusText: response.statusMessage,
              bodyText: Buffer.concat(chunks).toString('utf8'),
            })
          })
        },
      )

      request.on('error', reject)
      request.end()
    })
  }
}

async function requestViaFetch(
  fetcher: typeof fetch,
  credentials: LcuConnectionCredentials,
  endpointPath: string,
): Promise<LcuRawResponse> {
  const response = await fetcher(`${buildLcuBaseUrl(credentials)}${endpointPath}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: buildLcuAuthorizationHeader(credentials),
    },
  })

  return {
    status: response.status,
    statusText: response.statusText,
    bodyText: await response.text(),
  }
}

export async function fetchLcuChampSelectSession({
  credentials,
  endpointPath = '/lol-champ-select/v1/session',
  fetcher,
  requester = createNodeLcuHttpRequester(),
}: FetchLcuChampSelectSessionInput): Promise<LcuChampSelectSessionPayload | undefined> {
  const response = fetcher
    ? await requestViaFetch(fetcher, credentials, endpointPath)
    : await requester({ credentials, endpointPath })

  if (response.status === 404 || response.status === 409) {
    return undefined
  }

  if (response.status < 200 || response.status >= 300) {
    throw new Error(
      response.bodyText || `LCU champ-select request failed: ${response.status} ${response.statusText ?? ''}`.trim(),
    )
  }

  return JSON.parse(response.bodyText) as LcuChampSelectSessionPayload
}

export function createLcuPollingDraftSource({
  credentials,
  patchVersion,
  championCatalog,
  productMode,
  recommendationMode,
  fetcher,
  requester,
  now = () => new Date().toISOString(),
}: CreateLcuPollingDraftSourceInput): DesktopCompanionDraftSource<LcuChampSelectSessionPayload> {
  return {
    async readSnapshot(): Promise<DesktopCompanionSourceSnapshot<LcuChampSelectSessionPayload>> {
      const observedAt = now()
      const session = await fetchLcuChampSelectSession({ credentials, fetcher, requester })

      if (!session) {
        return {
          kind: 'LCU',
          status: 'unavailable',
          observedAt,
          message: 'LCU champ-select session is not currently available.',
        }
      }

      return {
        kind: 'LCU',
        status: 'active',
        observedAt,
        sourceEventId: [session.gameId, session.timer?.phase, session.timer?.internalNowInEpochMs].filter(Boolean).join(':'),
        message: 'LCU champ-select session polled successfully.',
        rawPayload: session,
        draftState: mapLcuChampSelectSessionToDraftState({
          session,
          patchVersion,
          championCatalog,
          productMode,
          recommendationMode,
        }),
      }
    },
    describe() {
      return `lcu:${buildLcuBaseUrl(credentials)}/lol-champ-select/v1/session`
    },
  }
}
