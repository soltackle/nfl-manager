import useSWR from 'swr'
import { apiFetch } from '@/lib/api'
import type { Tactics } from '@/types'

export function useTactics() {
  const { data, error, isLoading, mutate } = useSWR<{ data: Tactics }>(
    import.meta.env.VITE_SUPABASE_URL + '/functions/v1/tactics',
    apiFetch,
    { refreshInterval: 60_000 }
  )
  return { tactics: data?.data, error, isLoading, mutate }
}
