import { Navigate, Outlet } from 'react-router-dom'
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode'
import { useAuthStore } from '@/store/authStore'
import { Loader2 } from 'lucide-react'

export function MaintenanceGuard() {
  const { maintenanceMode, isLoading } = useMaintenanceMode()
  const { profile } = useAuthStore()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#001021]">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
      </div>
    )
  }

  const isAdmin = profile?.role === 'admin'

  if (maintenanceMode && !isAdmin) {
    return <Navigate to="/tadilat" replace />
  }

  return <Outlet />
}
