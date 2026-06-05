import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { User } from '@/types'

interface AuthState {
  user: SupabaseUser | null
  profile: User | null
  session: any | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signUp: (email: string, password: string, username: string) => Promise<void>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  session: null,
  isLoading: true,
  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  },
  signInWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/dashboard'
      }
    })
    if (error) throw error
  },
  signUp: async (email, password, username) => {
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: { data: { username } }
    })
    if (error) throw error
  },
  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null, session: null })
  },
  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    let profile = null
    
    if (session?.user) {
      const { data } = await supabase.from('users').select('*').eq('id', session.user.id).maybeSingle()
      profile = data
      const { useFranchiseStore } = await import('./franchiseStore')
      await useFranchiseStore.getState().initialize(session.user.id)
    }
    
    set({ session, user: session?.user || null, profile, isLoading: false })
    
    supabase.auth.onAuthStateChange(async (_event, session) => {
      let currentProfile = null
      if (session?.user) {
        const { data } = await supabase.from('users').select('*').eq('id', session.user.id).maybeSingle()
        currentProfile = data
        const { useFranchiseStore } = await import('./franchiseStore')
        await useFranchiseStore.getState().initialize(session.user.id)
      } else {
        const { useFranchiseStore } = await import('./franchiseStore')
        useFranchiseStore.getState().clearFranchise()
      }
      set({ session, user: session?.user || null, profile: currentProfile })
    })
  }
}))
