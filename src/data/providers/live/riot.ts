import { createBackendApiLiveDraftProvider, type CreateBackendApiLiveDraftProviderInput } from '@/data/providers/live/backendApi/provider'

export function createRiotApiLiveDraftProvider(
  input?: Omit<CreateBackendApiLiveDraftProviderInput, 'source'>,
) {
  return createBackendApiLiveDraftProvider({
    source: 'RIOT_API',
    ...input,
  })
}
