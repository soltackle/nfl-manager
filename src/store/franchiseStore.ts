import { create } from 'zustand'
import type { Franchise, League } from '@/types'

interface FranchiseState {
  franchise: Franchise | null
  league: League | null
  setFranchise: (f: Franchise) => void
  setLeague: (l: League) => void
  clearFranchise: () => void
  initialize: (userId: string) => Promise<void>
}

export const useFranchiseStore = create<FranchiseState>((set) => ({
  franchise: null,
  league: null,
  setFranchise: (franchise) => set({ franchise }),
  setLeague: (league) => set({ league }),
  clearFranchise: () => set({ franchise: null, league: null }),
  initialize: async (userId: string) => {
    // Fetch franchise for user
    const { data: fData } = await import('@/lib/supabase').then(m => m.supabase).then(supabase => 
      supabase.from('franchises').select('*').eq('user_id', userId).maybeSingle()
    )
    if (fData) {
      set({ franchise: fData })
      // Fetch league
      const { data: lData } = await import('@/lib/supabase').then(m => m.supabase).then(supabase => 
        supabase.from('leagues').select('*').eq('id', fData.league_id).maybeSingle()
      )
      if (lData) {
        set({ league: lData })
      }
    }
  }
}))
