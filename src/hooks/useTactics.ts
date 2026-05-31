import useSWR from 'swr'
import { apiFetch } from '@/lib/api'
import type { Tactics } from '@/types'

export function useTactics() {
  const { data, error, isLoading, mutate } = useSWR<{ data: Tactics }>(
    (('https://rqlurvmugjyvwwqhtirn.supabase.co') || 'https://rqlurvmugjyvwwqhtirn.supabase.co') + '/functions/v1/tactics',
    apiFetch,
    { refreshInterval: 60_000 }
  )
  return { tactics: data?.data, error, isLoading, mutate }
}
