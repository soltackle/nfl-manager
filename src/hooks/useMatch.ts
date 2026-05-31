import useSWR from 'swr'
import { supabase } from '@/lib/supabase'
import { useFranchiseStore } from '@/store/franchiseStore'
import type { Match } from '@/types'

export function useMatch() {
  const { franchise } = useFranchiseStore()

  const fetcher = async () => {
    if (!franchise) return null
    // Fetch the next match where home_score is 0 and away_score is 0 (or final_stats is empty)
    // To be precise, where final_stats->played is not true
    const { data, error } = await supabase
      .from('matches')
      .select('*, home_franchise:franchises!matches_home_franchise_id_fkey(team_name), away_franchise:franchises!matches_away_franchise_id_fkey(team_name)')
      .or(`home_franchise_id.eq.${franchise.id},away_franchise_id.eq.${franchise.id}`)
      .is('final_stats->played', null)
      .order('week', { ascending: true })
      .limit(1)
      .maybeSingle()
    
    if (error) throw error
    return data as Match | null
  }

  const { data, error, isLoading, mutate } = useSWR<Match | null>(
    franchise ? `match-next-${franchise.id}` : null,
    fetcher,
    { refreshInterval: 10_000 }
  )

  return { match: data, error, isLoading, mutate }
}
