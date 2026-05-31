import useSWR from 'swr'
import { supabase } from '@/lib/supabase'
import { useFranchiseStore } from '@/store/franchiseStore'
import type { DepthChart } from '@/types'

export function useDepthChart() {
  const { franchise } = useFranchiseStore()

  const fetcher = async () => {
    if (!franchise) return []
    const { data, error } = await supabase
      .from('depth_charts')
      .select('*')
      .eq('franchise_id', franchise.id)
    
    if (error) throw error
    return data as DepthChart[]
  }

  const { data, error, isLoading, mutate } = useSWR<DepthChart[]>(
    franchise ? `depth-chart-${franchise.id}` : null,
    fetcher,
    { refreshInterval: 60_000 }
  )

  return { depthChart: data ?? [], error, isLoading, mutate }
}
