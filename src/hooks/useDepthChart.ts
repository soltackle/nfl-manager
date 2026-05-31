import useSWR from 'swr'
import { apiFetch } from '@/lib/api'
import type { DepthChart } from '@/types'

export function useDepthChart() {
  const { data, error, isLoading, mutate } = useSWR<{ data: DepthChart[] }>(
    (('https://rqlurvmugjyvwwqhtirn.supabase.co') || 'https://rqlurvmugjyvwwqhtirn.supabase.co') + '/functions/v1/franchise-depth-chart',
    apiFetch,
    { refreshInterval: 60_000 }
  )
  return { depthChart: data?.data ?? [], error, isLoading, mutate }
}
