import useSWR from 'swr'
import { supabase } from '@/lib/supabase'
import { useFranchiseStore } from '@/store/franchiseStore'
import { apiFetch } from '@/lib/api'

export function useTraining() {
  const { franchise } = useFranchiseStore()

  // 1. Fetch Roster
  const fetchRoster = async () => {
    if (!franchise) return []
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('franchise_id', franchise.id)
      .order('overall', { ascending: false })
    
    if (error) throw error
    return data
  }

  // 2. Fetch Active Training Sessions
  const fetchSessions = async () => {
    if (!franchise) return []
    // Use an RPC or edge function if RLS blocks direct query. 
    // Assuming RLS allows select via migration 002.
    const { data, error } = await supabase
      .from('training_sessions')
      .select('*')
      .eq('franchise_id', franchise.id)
    
    if (error) throw error
    // Return only active sessions (completed_at > now)
    return data.filter(s => new Date(s.completed_at).getTime() > Date.now())
  }

  const { data: roster, mutate: mutateRoster } = useSWR(
    franchise ? `roster-${franchise.id}` : null,
    fetchRoster
  )

  const { data: sessions, mutate: mutateSessions } = useSWR(
    franchise ? `training-sessions-${franchise.id}` : null,
    fetchSessions,
    { refreshInterval: 60000 } // Refresh every minute to update timers
  )

  const startTraining = async (playerIds: string[], slot: string) => {
    if (!franchise) return
    const { data, error } = await supabase.functions.invoke('start-training', {
      body: { franchise_id: franchise.id, player_ids: playerIds, slot }
    })
    
    if (error) throw error
    mutateSessions()
    return data
  }

  return { 
    roster: roster || [], 
    sessions: sessions || [], 
    startTraining,
    mutateSessions 
  }
}
