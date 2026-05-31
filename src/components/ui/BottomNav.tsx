import { NavLink } from 'react-router-dom'
import { Home, Users, Activity, ShoppingCart, User } from 'lucide-react'

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-muted bg-primary pb-safe">
      <div className="flex h-16 items-center justify-around px-4">
        <NavItem to="/dashboard" icon={<Home />} label="Ana" />
        <NavItem to="/roster" icon={<Users />} label="Kadro" />
        <NavItem to="/match" icon={<Activity />} label="Maç" />
        <NavItem to="/market" icon={<ShoppingCart />} label="Pazar" />
        <NavItem to="/profile" icon={<User />} label="Profil" />
      </div>
    </nav>
  )
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center space-y-1 ${
          isActive ? 'text-accent' : 'text-gray-400 hover:text-gray-300'
        }`
      }
    >
      <div className="h-6 w-6">{icon}</div>
      <span className="text-[10px] font-medium">{label}</span>
    </NavLink>
  )
}
