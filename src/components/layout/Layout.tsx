import { Outlet } from 'react-router-dom'
import { BottomNav } from '../ui/BottomNav'

export function Layout() {
  return (
    <div className="min-h-screen bg-primary pb-16 text-white md:pb-0">
      {/* Top Navbar could go here if needed */}
      <main className="container mx-auto max-w-lg p-4">
        <Outlet />
      </main>
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  )
}
