import { useEffect } from 'react'
import { useAuthStore } from './store/authStore'
import { useMaintenanceStore } from './store/maintenanceStore'
import { AppRouter } from './router'
import { ToastContainer } from './components/ui/ToastContainer'

export default function App() {
  const { initialize, isLoading } = useAuthStore()

  useEffect(() => {
    initialize()
    useMaintenanceStore.getState().initialize()
  }, [initialize])

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-primary text-white">Yükleniyor...</div>
  }

  return (
    <>
      <AppRouter />
      <ToastContainer />
    </>
  )
}
