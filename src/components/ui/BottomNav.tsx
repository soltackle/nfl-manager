import { NavLink } from 'react-router-dom'
import { Home, Users, Activity, ShoppingCart, User } from 'lucide-react'

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-white/5 pb-safe">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
        <NavItem to="/dashboard" icon={Home} label="Ana Sayfa" />
        <NavItem to="/roster" icon={Users} label="Kadro" />
        <NavItem to="/match" icon={Activity} label="Maç" />
        <NavItem to="/market" icon={ShoppingCart} label="Pazar" />
        <NavItem to="/profile" icon={User} label="Profil" />
      </div>
    </nav>
  )
}

function NavItem({ to, icon: Icon, label }: { to: string; icon: unknown; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center w-16 h-full space-y-1 transition-all duration-300 relative ${
          isActive ? 'text-accent' : 'text-text-dim hover:text-white hover:bg-white/5 rounded-xl'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <div className="absolute top-0 h-1 w-8 rounded-b-full bg-accent shadow-[0_0_8px_rgba(232,93,4,0.8)]" />
          )}
          <Icon className={`h-5 w-5 ${isActive ? 'animate-bounce' : ''}`} style={{ animationIterationCount: isActive ? 1 : 0 }} />
          <span className="text-[10px] font-medium">{label}</span>
        </>
      )}
    </NavLink>
  )
}
