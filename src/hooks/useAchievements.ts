import useSWR from 'swr'
import { apiFetch } from '@/lib/api'
import type { Achievement } from '@/types'

export function useAchievements() {
  const { data, error, isLoading, mutate } = useSWR<{ data: Achievement[] }>(
    import.meta.env.VITE_SUPABASE_URL + '/functions/v1/achievements',
    apiFetch,
    { refreshInterval: 120_000 }
  )
  return { achievements: data?.data ?? [], error, isLoading, mutate }
}
