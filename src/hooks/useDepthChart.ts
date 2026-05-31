import useSWR from 'swr'
import { apiFetch } from '@/lib/api'
import type { DepthChart } from '@/types'

export function useDepthChart() {
  const { data, error, isLoading, mutate } = useSWR<{ data: DepthChart[] }>(
    import.meta.env.VITE_SUPABASE_URL + '/functions/v1/franchise-depth-chart',
    apiFetch,
    { refreshInterval: 60_000 }
  )
  return { depthChart: data?.data ?? [], error, isLoading, mutate }
}
