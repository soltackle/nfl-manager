import useSWR from 'swr'
import { apiFetch } from '@/lib/api'
import type { TrainingSession } from '@/types'

export function useTraining() {
  const { data, error, isLoading, mutate } = useSWR<{ data: TrainingSession[] }>(
    (('https://rqlurvmugjyvwwqhtirn.supabase.co') || 'https://rqlurvmugjyvwwqhtirn.supabase.co') + '/functions/v1/training-sessions', // assuming we have a GET endpoint
    apiFetch,
    { refreshInterval: 60_000 }
  )
  return { trainingSessions: data?.data ?? [], error, isLoading, mutate }
}
