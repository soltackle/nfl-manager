import useSWR from 'swr'
import { supabase } from '@/lib/supabase'
import { useFranchiseStore } from '@/store/franchiseStore'
import { useAuthStore } from '@/store/authStore'

export interface ScoutMission {
  id: string
  franchise_id: string
  position: string
  status: 'searching' | 'ready' | 'claimed'
  end_time: string
  created_date: string
  player_data: any
}

export function useScout() {
  const { franchise } = useFranchiseStore()
  const { user } = useAuthStore()

  const today = new Date().toISOString().split('T')[0]

  const fetcher = async () => {
    if (!franchise || !user) return null
    const { data, error } = await supabase
      .from('scout_missions')
      .select('*')
      .eq('franchise_id', franchise.id)
      .eq('created_date', today)
      .maybeSingle()
      
    if (error) throw error
    return data as ScoutMission | null
  }

  const { data: mission, error, isLoading, mutate } = useSWR<ScoutMission | null>(
    franchise && user ? `scout-${franchise.id}-${today}` : null,
    fetcher,
    { refreshInterval: 5000 } // check frequently for countdown sync
  )

  const startScout = async (position: string) => {
    if (!franchise) throw new Error('Franchise bulunamadı')
    const { data, error } = await supabase.functions.invoke('scout-start', {
      body: { franchise_id: franchise.id, position }
    })
    if (error) throw new Error(error.message)
    if (data?.error) throw new Error(data.error)
    await mutate()
    return data
  }

  const claimScout = async (selectedIndex: number) => {
    if (!mission) throw new Error('Görev bulunamadı')
    const { data, error } = await supabase.functions.invoke('scout-claim', {
      body: { mission_id: mission.id, selected_index: selectedIndex }
    })
    if (error) throw new Error(error.message)
    if (data?.error) throw new Error(data.error)
    await mutate()
    return data
  }

  return {
    mission,
    isLoading,
    error,
    startScout,
    claimScout,
    mutate
  }
}
