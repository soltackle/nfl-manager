import useSWR from 'swr'
import { apiFetch } from '@/lib/api'
import type { Achievement } from '@/types'

export function useAchievements() {
  const { data, error, isLoading, mutate } = useSWR<{ data: Achievement[] }>(
    (('https://rqlurvmugjyvwwqhtirn.supabase.co') || 'https://rqlurvmugjyvwwqhtirn.supabase.co') + '/functions/v1/achievements',
    apiFetch,
    { refreshInterval: 120_000 }
  )
  return { achievements: data?.data ?? [], error, isLoading, mutate }
}
