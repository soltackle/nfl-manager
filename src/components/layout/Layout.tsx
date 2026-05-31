import { Outlet } from 'react-router-dom'
import { BottomNav } from '../ui/BottomNav'
import { TopNav } from '../ui/TopNav'

export function Layout() {
  return (
    <div className="min-h-screen bg-primary text-text-bright flex flex-col">
      <TopNav />
      <main className="container mx-auto max-w-lg flex-1 p-4 pb-24 md:pb-8">
        <div className="animate-float" style={{ animationDuration: '6s', animationIterationCount: 1 }}>
          <Outlet />
        </div>
      </main>
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  )
}
