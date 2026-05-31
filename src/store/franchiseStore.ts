import { create } from 'zustand'
import type { Franchise, League } from '@/types'

interface FranchiseState {
  franchises: Franchise[]
  activeFranchiseId: string | null
  franchise: Franchise | null // The currently active franchise object
  league: League | null       // The league of the currently active franchise
  
  setActiveFranchise: (id: string | null) => Promise<void>
  setFranchise: (f: Franchise) => void
  setLeague: (l: League) => void
  clearFranchise: () => void
  initialize: (userId: string) => Promise<void>
}

export const useFranchiseStore = create<FranchiseState>((set, get) => ({
  franchises: [],
  activeFranchiseId: null,
  franchise: null,
  league: null,
  
  setActiveFranchise: async (id: string | null) => {
    if (!id) {
      set({ activeFranchiseId: null, franchise: null, league: null })
      return
    }
    
    const f = get().franchises.find(x => x.id === id)
    if (f) {
      set({ activeFranchiseId: id, franchise: f })
      const { data: lData } = await import('@/lib/supabase').then(m => m.supabase).then(supabase => 
        supabase.from('leagues').select('*').eq('id', f.league_id).maybeSingle()
      )
      if (lData) {
        set({ league: lData })
      }
    }
  },
  
  setFranchise: (franchise) => set({ franchise }),
  setLeague: (league) => set({ league }),
  clearFranchise: () => set({ franchises: [], activeFranchiseId: null, franchise: null, league: null }),
  
  initialize: async (userId: string) => {
    // Fetch ALL franchises for user
    const { data: fData } = await import('@/lib/supabase').then(m => m.supabase).then(supabase => 
      supabase.from('franchises').select('*').eq('user_id', userId)
    )
    
    if (fData) {
      set({ franchises: fData })
    } else {
      set({ franchises: [] })
    }
  }
}))
