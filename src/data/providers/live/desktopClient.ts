import { createBackendApiLiveDraftProvider, type CreateBackendApiLiveDraftProviderInput } from '@/data/providers/live/backendApi/provider'

export function createDesktopClientLiveDraftProvider(
  input?: Omit<CreateBackendApiLiveDraftProviderInput, 'source'>,
) {
  return createBackendApiLiveDraftProvider({
    source: 'DESKTOP_CLIENT',
    ...input,
  })
}
