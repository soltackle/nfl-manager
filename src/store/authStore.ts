import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: any | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, username: string) => Promise<void>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
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
    set({ user: null, session: null })
  },
  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    set({ session, user: session?.user || null, isLoading: false })
    
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user || null })
    })
  }
}))
