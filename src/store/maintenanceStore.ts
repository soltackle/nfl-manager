import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

interface MaintenanceState {
  maintenanceMode: boolean
  maintenanceMessage: string | null
  isLoading: boolean
  initialized: boolean
  initialize: () => void
  refetch: () => Promise<void>
  setMaintenance: (enabled: boolean) => Promise<void>
}

export const useMaintenanceStore = create<MaintenanceState>((set, get) => ({
  maintenanceMode: true,
  maintenanceMessage: null,
  isLoading: true,
  initialized: false,

  refetch: async () => {
    const { data, error } = await supabase
      .from('site_settings')
      .select('maintenance_mode, maintenance_message')
      .eq('id', 1)
      .maybeSingle()

    if (error) {
      console.error('site_settings fetch error:', error)
      set({ maintenanceMode: true, isLoading: false })
    } else {
      set({
        maintenanceMode: data?.maintenance_mode ?? true,
        maintenanceMessage: data?.maintenance_message ?? null,
        isLoading: false,
      })
    }
  },

  initialize: () => {
    if (get().initialized) return
    set({ initialized: true })

    get().refetch()

    supabase
      .channel('site_settings_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'site_settings' },
        (payload) => {
          const row = payload.new as { maintenance_mode?: boolean; maintenance_message?: string }
          const updates: Partial<MaintenanceState> = {}
          if (row?.maintenance_mode !== undefined) updates.maintenanceMode = row.maintenance_mode
          if (row?.maintenance_message !== undefined) updates.maintenanceMessage = row.maintenance_message
          if (Object.keys(updates).length > 0) set(updates)
        }
      )
      .subscribe()
  },

  setMaintenance: async (enabled: boolean) => {
    const { error } = await supabase
      .from('site_settings')
      .update({ maintenance_mode: enabled, updated_at: new Date().toISOString() })
      .eq('id', 1)

    if (error) throw error
    set({ maintenanceMode: enabled })
  },
}))
