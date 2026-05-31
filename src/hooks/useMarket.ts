import useSWR from 'swr'
import { supabase } from '@/lib/supabase'
import type { Player } from '@/types'

export function useMarket() {
  const fetcher = async () => {
    const { data, error } = await supabase
      .from('players')
      .select('*')
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
