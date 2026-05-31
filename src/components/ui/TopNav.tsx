import { useAuthStore } from '@/store/authStore'
import { useFranchiseStore } from '@/store/franchiseStore'
import { Bell, UserCircle, Coins, Shield } from 'lucide-react'
import { NavLink } from 'react-router-dom'

export function TopNav() {
  const { user } = useAuthStore()
  const { franchise } = useFranchiseStore()

  return (
    <div className="w-full bg-gradient-to-b from-[#003366] to-[#001f40] border-b-2 border-accent text-white shadow-xl">
      {/* Top Bar with Info */}
      <div className="container mx-auto max-w-6xl px-4 py-2 flex items-center justify-between">
        
        {/* Left: Shield & Team Name */}
        <div className="flex items-center gap-3 w-1/3">
          <div className="relative">
            <Shield className="h-10 w-10 text-accent drop-shadow-[0_0_8px_rgba(255,156,0,0.6)]" fill="currentColor" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-display font-bold text-lg tracking-wide uppercase">{franchise?.team_name || 'NFL Manager'}</span>
            <span className="text-xs text-[#00a2ff] font-bold">TÜRKİYE</span>
          </div>
        </div>

        {/* Center: Logo / Timer */}
        <div className="flex flex-col items-center justify-center w-1/3">
          <div className="bg-red-600 px-4 py-1 rounded-b-xl border-x-2 border-b-2 border-white shadow-lg -mt-2">
            <span className="font-display font-bold text-xl italic tracking-tighter">NFLM</span>
          </div>
        </div>

        {/* Right: Economy & Profile */}
        <div className="flex items-center justify-end gap-3 w-1/3">
          
          <div className="flex items-center bg-[#00152b] rounded-full p-1 pr-4 border border-[#004b93]">
            <div className="bg-accent rounded-full p-1 mr-2 shadow-inner">
              <Coins className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-sm text-yellow-400">217</span>
          </div>

          <div className="flex items-center bg-[#00152b] rounded-full p-1 pr-4 border border-[#004b93]">
            <div className="bg-[#00a2ff] rounded-full p-1 mr-2 shadow-inner text-white font-bold text-xs w-6 h-6 flex items-center justify-center">
              $
            </div>
            <span className="font-bold text-sm text-white">{franchise?.club_fund ? `${(franchise.club_fund / 1000000).toFixed(1)}M` : '0M'}</span>
          </div>

          <div className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-1 rounded-lg transition-colors ml-2">
            <div className="text-right hidden sm:block">
              <div className="font-bold text-sm leading-tight">{user?.username}</div>
              <div className="text-[10px] text-gray-400 font-bold bg-[#00152b] inline-block px-1.5 rounded">LVL 5</div>
            </div>
            <UserCircle className="h-8 w-8 text-white" />
          </div>

        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="bg-[#001f40] border-t border-[#003366]">
        <div className="container mx-auto max-w-6xl px-4 flex items-center justify-center gap-1 overflow-x-auto no-scrollbar">
          <NavTab to="/dashboard" label="EV SAHİBİ" />
          <NavTab to="/roster" label="TAKIM" />
          <NavTab to="/training" label="ANTRENMAN SAHASI" />
          <NavTab to="/matches" label="MAÇLAR" />
          <NavTab to="/club" label="KULÜP" />
          <NavTab to="/staff" label="TEKNİK EKİP" />
          <NavTab to="/market" label="MAĞAZA" />
        </div>
      </div>
    </div>
  )
}

function NavTab({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `whitespace-nowrap px-4 py-2.5 font-display font-bold text-sm transition-all border-b-4 ${
          isActive 
            ? 'text-accent border-accent bg-white/5' 
            : 'text-[#9cb1ce] border-transparent hover:text-white hover:bg-white/5 hover:border-white/20'
        }`
      }
    >
      {label}
    </NavLink>
  )
}
