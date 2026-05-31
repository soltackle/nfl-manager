import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { LoginPage } from './pages/auth/LoginPage'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { RosterPage } from './pages/roster/RosterPage'
import { DepthChartPage } from './pages/depth-chart/DepthChartPage'
import { TacticsPage } from './pages/tactics/TacticsPage'
import { MarketPage } from './pages/market/MarketPage'
import { MatchResultPage } from './pages/match/MatchResultPage'
import { DraftPage } from './pages/draft/DraftPage'
import { useAuthStore } from './store/authStore'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore()
  if (isLoading) return <div>Yükleniyor...</div>
  if (!user) return <Navigate to="/login" />
  return <>{children}</>
}

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: <ProtectedRoute><Layout /></ProtectedRoute>,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'roster', element: <RosterPage /> },
      { path: 'depth-chart', element: <DepthChartPage /> },
      { path: 'tactics', element: <TacticsPage /> },
      { path: 'market', element: <MarketPage /> },
      { path: 'match', element: <div>Next Match Stub</div> }, // STUB
      { path: 'match/:id', element: <MatchResultPage /> },
      { path: 'draft', element: <DraftPage /> },
      { path: 'profile', element: <div>Profile Stub</div> }, // STUB
    ]
  }
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
