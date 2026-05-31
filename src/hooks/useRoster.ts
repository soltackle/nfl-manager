import useSWR from 'swr'
import { apiFetch } from '@/lib/api'
import type { Player } from '@/types'

export function useRoster() {
  const { data, error, isLoading, mutate } = useSWR<{ data: Player[] }>(
    import.meta.env.VITE_SUPABASE_URL + '/functions/v1/franchise-roster',
    apiFetch,
    { refreshInterval: 60_000 }
  )
  return { roster: data?.data ?? [], error, isLoading, mutate }
}
