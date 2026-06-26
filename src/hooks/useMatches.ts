import useSWR from 'swr'
import { supabase } from '@/lib/supabase'
import { useFranchiseStore } from '@/store/franchiseStore'
import type { Match } from '@/types'

export function useMatches() {
  const { franchise } = useFranchiseStore()

  const fetcher = async () => {
    if (!franchise) return []
    const { data, error } = await supabase
      .from('matches')
      .select('*, home_franchise:franchises!matches_home_franchise_id_fkey(team_name), away_franchise:franchises!matches_away_franchise_id_fkey(team_name)')
      .or(`home_franchise_id.eq.${franchise.id},away_franchise_id.eq.${franchise.id}`)
      .order('week', { ascending: true })
    
    if (error) throw error
    return data as Match[]
  }

  const { data, error, isLoading, mutate } = useSWR<Match[]>(
    franchise ? `matches-all-${franchise.id}` : null,
    fetcher
  )

  return { matches: data ?? [], error, isLoading, mutate }
}
