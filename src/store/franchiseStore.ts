import { create } from 'zustand'
import type { Franchise, League } from '@/types'

interface FranchiseState {
  franchise: Franchise | null
  league: League | null
  setFranchise: (f: Franchise) => void
  setLeague: (l: League) => void
  clearFranchise: () => void
}

export const useFranchiseStore = create<FranchiseState>((set) => ({
  franchise: null,
  league: null,
  setFranchise: (franchise) => set({ franchise }),
  setLeague: (league) => set({ league }),
  clearFranchise: () => set({ franchise: null, league: null })
}))
