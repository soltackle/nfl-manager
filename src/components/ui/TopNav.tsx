import { useAuthStore } from '@/store/authStore'
import { useFranchiseStore } from '@/store/franchiseStore'
import { Bell, Shield } from 'lucide-react'

export function TopNav() {
  const { user } = useAuthStore()
  const { franchise } = useFranchiseStore()

  return (
    <div className="sticky top-0 z-50 w-full glass-panel border-b border-white/5 px-4 py-3">
      <div className="mx-auto flex max-w-lg items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-hover shadow-lg shadow-accent/20">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="font-display text-sm font-bold leading-tight text-white">
              {franchise?.team_name || 'NFL Manager'}
            </h2>
            <p className="text-xs text-text-dim">
              Bütçe: <span className="font-semibold text-accent">${franchise?.club_fund.toLocaleString()}</span>
            </p>
          </div>
        </div>
        
        <button className="relative rounded-full p-2 text-text-dim transition-colors hover:bg-white/10 hover:text-white">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 block h-2 w-2 rounded-full bg-accent ring-2 ring-primary"></span>
        </button>
      </div>
    </div>
  )
}
