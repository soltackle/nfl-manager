import { Outlet } from 'react-router-dom'
import { TopNav } from '../ui/TopNav'

export function Layout() {
  return (
    <div className="min-h-screen text-text-bright flex flex-col relative">
      <div className="absolute inset-0 bg-black/40 z-[-1]"></div>
      <TopNav />
      <main className="w-full max-w-6xl mx-auto flex-1 p-4 pb-24 md:pb-8">
        <div className="animate-float" style={{ animationDuration: '6s', animationIterationCount: 1 }}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
