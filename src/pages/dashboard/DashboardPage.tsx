import { useAuthStore } from '@/store/authStore'
import { useFranchiseStore } from '@/store/franchiseStore'
import { useMatch } from '@/hooks/useMatch'
import { useStandings } from '@/hooks/useStandings'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'

export function DashboardPage() {
  const { user } = useAuthStore()
  const { franchise, league } = useFranchiseStore()
  const { match, isLoading: isMatchLoading } = useMatch()
  const { standings, isLoading: isStandingsLoading } = useStandings(league?.id)

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Hoş Geldin, {user?.username}</h1>
        <p className="text-sm text-gray-400">{franchise?.team_name} - Bütçe: ${franchise?.club_fund.toLocaleString()}</p>
      </header>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Sonraki Maç</h2>
        {isMatchLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : match ? (
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div className="text-center">
                <div className="font-bold">{match.home_franchise_id === franchise?.id ? 'Sen' : 'Rakip'}</div>
              </div>
              <div className="text-2xl font-bold">VS</div>
              <div className="text-center">
                <div className="font-bold">{match.away_franchise_id === franchise?.id ? 'Sen' : 'Rakip'}</div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <p className="text-sm text-gray-400">Bekleyen maç yok.</p>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Mini Puan Durumu</h2>
        {isStandingsLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <Card>
            <div className="divide-y divide-muted">
              {standings?.slice(0, 5).map((team, idx) => (
                <div key={team.id} className="flex items-center justify-between p-3 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400">{idx + 1}.</span>
                    <span className={team.user_id === user?.id ? 'font-bold text-accent' : ''}>
                      Takım {team.id.slice(0,4)}
                    </span>
                  </div>
                  <div className="font-mono">{team.points} P</div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </section>
      
      {/* STUB: Bekleyen bildirimler */}
    </div>
  )
}
