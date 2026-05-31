import useSWR from 'swr'
import { apiFetch } from '@/lib/api'
import type { Match } from '@/types'

export function useMatch() {
  const { data, error, isLoading, mutate } = useSWR<{ data: Match }>(
    (('https://rqlurvmugjyvwwqhtirn.supabase.co') || 'https://rqlurvmugjyvwwqhtirn.supabase.co') + '/functions/v1/matches-next',
    apiFetch,
    { refreshInterval: 10_000 }
  )
  return { match: data?.data, error, isLoading, mutate }
}
