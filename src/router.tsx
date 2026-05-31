import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { LoginPage } from './pages/auth/LoginPage'
import { SlotsPage } from './pages/auth/SlotsPage'
import { LeaguesPage } from './pages/auth/LeaguesPage'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { RosterPage } from './pages/roster/RosterPage'
import { DepthChartPage } from './pages/depth-chart/DepthChartPage'
import { TacticsPage } from './pages/tactics/TacticsPage'
import { MarketPage } from './pages/market/MarketPage'
import { MatchResultPage } from './pages/match/MatchResultPage'
import { DraftPage } from './pages/draft/DraftPage'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { AdminRoute } from './components/auth/AdminRoute'
import { useAuthStore } from './store/authStore'
import { useFranchiseStore } from './store/franchiseStore'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore()
  if (isLoading) return <div>Yükleniyor...</div>
  if (!user) return <Navigate to="/login" />
  return <>{children}</>
}

// Guard specifically for pages that require an active franchise
function FranchiseRoute({ children }: { children: React.ReactNode }) {
  const { activeFranchiseId } = useFranchiseStore()
  if (!activeFranchiseId) return <Navigate to="/slots" replace />
  return <>{children}</>
}

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: <ProtectedRoute><Outlet /></ProtectedRoute>,
    children: [
      { index: true, element: <Navigate to="/slots" replace /> },
      { path: 'slots', element: <SlotsPage /> },
      { path: 'leagues', element: <LeaguesPage /> },
      {
        path: '',
        element: <FranchiseRoute><Layout /></FranchiseRoute>,
        children: [
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'roster', element: <RosterPage /> },
          { path: 'depth-chart', element: <DepthChartPage /> },
          { path: 'tactics', element: <TacticsPage /> },
          { path: 'market', element: <MarketPage /> },
          { path: 'match', element: <div>Next Match Stub</div> },
          { path: 'match/:id', element: <MatchResultPage /> },
          { path: 'draft', element: <DraftPage /> },
          { path: 'profile', element: <div>Profile Stub</div> },
          { path: 'training', element: <div className="p-8 text-center text-xl font-bold">Antrenman Sayfası Yapım Aşamasında</div> },
        ]
      },
      { 
        path: 'admin', 
        element: <AdminRoute />,
        children: [
          { index: true, element: <AdminDashboard /> }
        ]
      },
      { path: '*', element: <Navigate to="/slots" replace /> }
    ]
  }
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
