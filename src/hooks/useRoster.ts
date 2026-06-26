import useSWR from 'swr'
import { supabase } from '@/lib/supabase'
import { useFranchiseStore } from '@/store/franchiseStore'
import type { Player } from '@/types'

export function useRoster() {
  const { franchise } = useFranchiseStore()

  const fetcher = async () => {
    if (!franchise) return []
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('franchise_id', franchise.id)
      .order('overall', { ascending: false })
    
    if (error) throw error
    return data as Player[]
  }

  const { data, error, isLoading, mutate } = useSWR<Player[]>(
    franchise ? `roster-${franchise.id}` : null,
    fetcher,
    { refreshInterval: 60_000 }
  )

  return { roster: data ?? [], error, isLoading, mutate }
}
