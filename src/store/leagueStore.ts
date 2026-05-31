import { create } from 'zustand'

interface LeagueState {
  activeLeagueId: string | null
  setActiveLeagueId: (id: string | null) => void
}

export const useLeagueStore = create<LeagueState>((set) => ({
  activeLeagueId: null,
  setActiveLeagueId: (id) => set({ activeLeagueId: id })
}))
