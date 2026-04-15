import { useEffect, useState } from 'react'

export type BackendAvailabilityStatus = 'checking' | 'available' | 'unavailable'

interface UseBackendAvailabilityResult {
  status: BackendAvailabilityStatus
  isAvailable: boolean
}

export function useBackendAvailability(): UseBackendAvailabilityResult {
  const [status, setStatus] = useState<BackendAvailabilityStatus>('checking')

  useEffect(() => {
    let isCancelled = false

    async function checkBackendAvailability() {
      try {
        const response = await fetch('/api/health')

        if (isCancelled) {
          return
        }

        setStatus(response.ok ? 'available' : 'unavailable')
      } catch {
        if (!isCancelled) {
          setStatus('unavailable')
        }
      }
    }

    void checkBackendAvailability()

    return () => {
      isCancelled = true
    }
  }, [])

  return {
    status,
    isAvailable: status === 'available',
  }
}
