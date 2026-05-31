import useSWR from 'swr'
import { apiFetch } from '@/lib/api'
import type { Player } from '@/types'

export function useRoster() {
  const { data, error, isLoading, mutate } = useSWR<{ data: Player[] }>(
    (('https://rqlurvmugjyvwwqhtirn.supabase.co') || 'https://rqlurvmugjyvwwqhtirn.supabase.co') + '/functions/v1/franchise-roster',
    apiFetch,
    { refreshInterval: 60_000 }
  )
  return { roster: data?.data ?? [], error, isLoading, mutate }
}
