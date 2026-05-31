import useSWR from 'swr'
import { apiFetch } from '@/lib/api'
import type { LeagueMember } from '@/types'

export function useStandings(leagueId?: string) {
  const { data, error, isLoading, mutate } = useSWR<{ data: LeagueMember[] }>(
    leagueId ? (('https://rqlurvmugjyvwwqhtirn.supabase.co') || 'https://rqlurvmugjyvwwqhtirn.supabase.co') + `/functions/v1/league-standings?league_id=${leagueId}` : null,
    apiFetch,
    { refreshInterval: 120_000 }
  )
  return { standings: data?.data ?? [], error, isLoading, mutate }
}
