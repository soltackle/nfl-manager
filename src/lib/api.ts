import { useAuthStore } from '@/store/authStore'

export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const session = useAuthStore.getState().session
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options?.headers,
    },
  })
  
  if (!res.ok) {
    let err
    try {
      err = await res.json()
    } catch {
      err = { error: res.statusText }
    }
    throw new Error(err.error ?? 'api_error')
  }
  
  return res.json()
}
