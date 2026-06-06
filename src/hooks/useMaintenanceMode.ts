import { useMaintenanceStore } from '@/store/maintenanceStore'

export function useMaintenanceMode() {
  const maintenanceMode = useMaintenanceStore((s) => s.maintenanceMode)
  const maintenanceMessage = useMaintenanceStore((s) => s.maintenanceMessage)
  const isLoading = useMaintenanceStore((s) => s.isLoading)
  const setMaintenance = useMaintenanceStore((s) => s.setMaintenance)
  const refetch = useMaintenanceStore((s) => s.refetch)

  return { maintenanceMode, maintenanceMessage, isLoading, setMaintenance, refetch }
}
