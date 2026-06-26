import { create } from 'zustand'

interface UiStore {
  isLoading: boolean
  loadingMessage: string
  setLoading: (isLoading: boolean, message?: string) => void
}

export const useUiStore = create<UiStore>((set) => ({
  isLoading: false,
  loadingMessage: '',
  setLoading: (isLoading, message = '') => set({ isLoading, loadingMessage: message })
}))
