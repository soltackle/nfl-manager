import useSWR from 'swr'
import { apiFetch } from '@/lib/api'
import { SUPABASE_URL } from '@/lib/supabase'
import type { Achievement } from '@/types'

export function useAchievements() {
  const { data, error, isLoading, mutate } = useSWR<{ data: Achievement[] }>(
    SUPABASE_URL + '/functions/v1/achievements',
    apiFetch,
    { refreshInterval: 120_000 }
  )
  return { achievements: data?.data ?? [], error, isLoading, mutate }
}
