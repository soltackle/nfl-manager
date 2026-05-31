import useSWR from 'swr'
import { apiFetch } from '@/lib/api'
import type { DraftSession } from '@/types'

export function useDraft(leagueId?: string) {
  const { data, error, isLoading, mutate } = useSWR<{ data: DraftSession }>(
    leagueId ? (('https://rqlurvmugjyvwwqhtirn.supabase.co') || 'https://rqlurvmugjyvwwqhtirn.supabase.co') + `/functions/v1/draft-session?league_id=${leagueId}` : null,
    apiFetch,
    { refreshInterval: 3_000 }
  )
  return { draftSession: data?.data, error, isLoading, mutate }
}
