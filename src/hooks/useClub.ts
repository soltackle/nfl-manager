import useSWR from 'swr'
import { supabase } from '@/lib/supabase'
import { useFranchiseStore } from '@/store/franchiseStore'

export function useClub() {
  const { franchise, initialize } = useFranchiseStore()

  const fetchStadium = async () => {
    if (!franchise) return null
    const { data, error } = await supabase
      .from('stadiums')
      .select('*')
      .eq('franchise_id', franchise.id)
      .single()
    
    // If no stadium exists yet, return default level 0
    if (error && error.code === 'PGRST116') {
      return { turf_level: 0, capacity_level: 0, practice_facility_level: 0 }
    }
    if (error) throw error
    return data
  }

  const { data: stadium, mutate: mutateStadium } = useSWR(
    franchise ? `stadium-${franchise.id}` : null,
    fetchStadium
  )

  const upgradeStadium = async (upgradeType: 'turf' | 'capacity' | 'practice') => {
    if (!franchise) return
    const { data, error } = await supabase.functions.invoke('upgrade-stadium', {
      body: { franchise_id: franchise.id, upgrade_type: upgradeType }
    })
    
    if (error) throw error
    
    // Refresh both stadium and franchise (since club_fund changed)
    mutateStadium()
    if (franchise.user_id) {
      await initialize(franchise.user_id)
    }
    return data
  }

  return { 
    stadium: stadium || { turf_level: 0, capacity_level: 0, practice_facility_level: 0 }, 
    upgradeStadium 
  }
}
