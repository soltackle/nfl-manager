import useSWR from 'swr'
import { supabase } from '@/lib/supabase'
import type { Player } from '@/types'

export function useMarket() {
  const fetcher = async () => {
    // 1. Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // 2. Get their active franchise's league_id
    const { data: franchise } = await supabase
      .from('franchises')
      .select('league_id')
      .eq('user_id', user.id)
      .single()
      
    if (!franchise) return []

    // 3. Fetch free agents for that league
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('league_id', franchise.league_id)
      .is('franchise_id', null)
      .order('overall', { ascending: false })
      .limit(50)
    
    if (error) throw error
    return data as Player[]
  }

  const { data, error, isLoading, mutate } = useSWR<Player[]>(
    'market-free-agents',
    fetcher,
    { refreshInterval: 30_000 }
  )

  return { freeAgents: data ?? [], error, isLoading, mutate }
}
