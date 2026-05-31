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
import { TrainingPage } from './pages/training/TrainingPage'
import { ClubPage } from './pages/club/ClubPage'
import { MatchResultPage } from './pages/match/MatchResultPage'
import { DraftPage } from './pages/draft/DraftPage'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { AdminRoute } from './components/auth/AdminRoute'
import { useAuthStore } from './store/authStore'
import { useFranchiseStore } from './store/franchiseStore'
import { FranchiseSetupPage } from './pages/onboarding/FranchiseSetupPage'
import { LeagueLobbyPage } from './pages/lobby/LeagueLobbyPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore()
  if (isLoading) return <div>Yükleniyor...</div>
  if (!user) return <Navigate to="/login" />
  return <>{children}</>
}

// Guard for pages that require an active franchise
function FranchiseRoute({ children }: { children: React.ReactNode }) {
  const { activeFranchiseId, franchise } = useFranchiseStore()
  if (!activeFranchiseId) return <Navigate to="/slots" replace />
  
  // Franchise ID set but data not loaded yet → show loading
  if (!franchise) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#001021] text-white">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60 font-bold uppercase text-sm">Yükleniyor...</p>
        </div>
      </div>
    )
  }
  
  return <>{children}</>
}

// Guard for game pages (Dashboard, Roster etc) to ensure league has started
function GameRoute({ children }: { children: React.ReactNode }) {
  const { activeFranchiseId, franchise, league } = useFranchiseStore()
  
  // No franchise selected at all → go to slots
  if (!activeFranchiseId) return <Navigate to="/slots" replace />
  
  // Franchise ID is set but data not loaded yet → show loading (don't redirect!)
  if (!franchise || !league) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#001021] text-white">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60 font-bold uppercase text-sm">Lig Yükleniyor...</p>
        </div>
      </div>
    )
  }
  
  if (franchise.team_name.endsWith(' Team')) {
    return <Navigate to="/setup" replace />
  }
  
  if (league.status === 'waiting') {
    return <Navigate to="/lobby" replace />
  }

  if (league.status === 'draft') {
    return <Navigate to="/draft" replace />
  }

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
      
      // Setup and Lobby are standalone screens
      {
        path: '',
        element: <FranchiseRoute><Outlet /></FranchiseRoute>,
        children: [
          { path: 'setup', element: <FranchiseSetupPage /> },
          { path: 'lobby', element: <LeagueLobbyPage /> },
          { path: 'draft', element: <DraftPage /> },
        ]
      },

      // Game screens wrapped in Layout and GameRoute
      {
        path: '',
        element: <GameRoute><Layout /></GameRoute>,
        children: [
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'roster', element: <RosterPage /> },
          { path: 'depth-chart', element: <DepthChartPage /> },
          { path: 'tactics', element: <TacticsPage /> },
          { path: 'market', element: <MarketPage /> },
          { path: 'match', element: <div>Next Match Stub</div> },
          { path: 'match/:id', element: <MatchResultPage /> },
          { path: 'profile', element: <div>Profile Stub</div> },
          { path: 'training', element: <TrainingPage /> },
          { path: 'club', element: <ClubPage /> },
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
