import useSWR from 'swr'
import { supabase } from '@/lib/supabase'
import { useFranchiseStore } from '@/store/franchiseStore'
import type { Tactics } from '@/types'

export function useTactics() {
  const { franchise } = useFranchiseStore()

  const fetcher = async () => {
    if (!franchise) return null
    const { data, error } = await supabase
      .from('tactics')
      .select('*')
      .eq('franchise_id', franchise.id)
      .maybeSingle()
    
    if (error) throw error
    
    // If no tactics exist for franchise, return default
    if (!data) {
      return {
        id: 'new',
        franchise_id: franchise.id,
        slider_ayarlari: { pass_ratio: 50, aggression: 50, tempo: 50, defense_line: 50 },
        paketler: []
      } as Tactics
    }
    return data as Tactics
  }

  const { data, error, isLoading, mutate } = useSWR<Tactics | null>(
    franchise ? `tactics-${franchise.id}` : null,
    fetcher,
    { refreshInterval: 60_000 }
  )

  return { tactics: data, error, isLoading, mutate }
}
