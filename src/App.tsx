import { useEffect } from 'react'
import { useAuthStore } from './store/authStore'
import { AppRouter } from './router'

export default function App() {
  const { initialize, isLoading } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-primary text-white">Yükleniyor...</div>
  }

  return <AppRouter />
}
