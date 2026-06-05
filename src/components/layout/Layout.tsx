import { Outlet } from 'react-router-dom'
import { TopNav } from '../ui/TopNav'
import { GameHint } from '../ui/GameHint'
import { useUiStore } from '@/store/uiStore'

export function Layout({ children }: { children?: React.ReactNode }) {
  const { isLoading, loadingMessage } = useUiStore()

  return (
    <div className="min-h-screen text-text-bright flex flex-col relative">
      <div className="absolute inset-0 bg-black/40 z-[-1]"></div>
      <TopNav />
      <main className="w-full max-w-6xl mx-auto flex-1 p-4 pb-24 md:pb-8">
        <div className="animate-float" style={{ animationDuration: '6s', animationIterationCount: 1 }}>
          {children || <Outlet />}
        </div>
      </main>
      <GameHint />
      {isLoading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          {loadingMessage && <p className="text-white mt-4 font-bold tracking-widest uppercase">{loadingMessage}</p>}
        </div>
      )}
    </div>
  )
}
