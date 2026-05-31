import useSWR from 'swr'
import { apiFetch } from '@/lib/api'
import type { Player } from '@/types'

export function useMarket() {
  const { data, error, isLoading, mutate } = useSWR<{ data: Player[] }>(
    (('https://rqlurvmugjyvwwqhtirn.supabase.co') || 'https://rqlurvmugjyvwwqhtirn.supabase.co') + '/functions/v1/market-free-agents',
    apiFetch,
    { refreshInterval: 30_000 }
  )
  return { freeAgents: data?.data ?? [], error, isLoading, mutate }
}
