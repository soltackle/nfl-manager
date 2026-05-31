import useSWR from 'swr'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useFranchiseStore } from '@/store/franchiseStore'

export function useDraft() {
  const { franchise } = useFranchiseStore()
  const [draftSession, setDraftSession] = useState<any>(null)
  const [availablePlayers, setAvailablePlayers] = useState<any[]>([])
  const [picks, setPicks] = useState<any[]>([])

  useEffect(() => {
    if (!franchise) return

    const fetchInitialData = async () => {
      // Get session
      const { data: session } = await supabase
        .from('draft_sessions')
        .select('*')
        .eq('league_id', franchise.league_id)
        .single()
      
      setDraftSession(session)

      if (session) {
        // Fetch picks
        const { data: pickData } = await supabase
          .from('draft_picks')
          .select('*, players(*), franchises(team_name)')
          .eq('session_id', session.id)
          .order('created_at', { ascending: false })
        setPicks(pickData || [])
      }

      // Fetch global available players (Draft pool)
      // Since players don't have league_id, we fetch top 100 free agents
      const { data: players } = await supabase
        .from('players')
        .select('*')
        .is('franchise_id', null)
        .order('overall', { ascending: false })
        .limit(100)
      
      setAvailablePlayers(players || [])
    }

    fetchInitialData()

    // Realtime subscriptions
    const channel = supabase.channel('draft_room')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'draft_picks' }, (payload) => {
        // Refresh picks
        fetchInitialData() 
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'draft_sessions' }, (payload) => {
        setDraftSession(payload.new)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [franchise])

  const makePick = async (playerId: string) => {
    if (!franchise || !draftSession) return
    const { data, error } = await supabase.functions.invoke('make-draft-pick', {
      body: { franchise_id: franchise.id, session_id: draftSession.id, player_id: playerId }
    })
    if (error) throw error
    return data
  }

  return { 
    draftSession, 
    availablePlayers,
    picks,
    makePick,
    isLoading: !draftSession 
  }
}
