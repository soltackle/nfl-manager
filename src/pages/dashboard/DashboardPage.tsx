import { useAuthStore } from '@/store/authStore'
import { useFranchiseStore } from '@/store/franchiseStore'
import { useMatch } from '@/hooks/useMatch'
import { useStandings } from '@/hooks/useStandings'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { Trophy, TrendingUp, Users, ArrowRight, Activity, Calendar } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function DashboardPage() {
  const { user } = useAuthStore()
  const { franchise, league } = useFranchiseStore()
  const { match, isLoading: isMatchLoading } = useMatch()
  const { standings, isLoading: isStandingsLoading } = useStandings(league?.id)
  const navigate = useNavigate()

  const myStanding = standings?.find(s => s.user_id === user?.id)
  const rank = standings?.findIndex(s => s.user_id === user?.id) ?? -1

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent to-accent-hover p-6 shadow-xl shadow-accent/20">
        <div className="absolute -right-4 -top-12 opacity-10">
          <Trophy className="h-48 w-48" />
        </div>
        <div className="relative z-10">
          <span className="mb-2 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold tracking-wider text-white backdrop-blur-sm">
            SEZON 1 • {league?.name || 'Global Lig'}
          </span>
          <h1 className="mb-1 text-3xl font-bold text-white md:text-4xl">
            Hoş Geldin, <br /> {franchise?.team_name || user?.username}
          </h1>
          <p className="max-w-[80%] text-sm font-medium text-white/80">
            Takımını kur, taktiklerini ayarla ve şampiyonluğa yürü.
          </p>
        </div>
      </section>

      {/* Quick Stats Grid */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="bg-primary-light border-none">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <Trophy className="h-6 w-6 text-yellow-400 mb-2" />
            <div className="text-xs text-text-dim font-medium uppercase tracking-wider mb-1">Lig Sırası</div>
            <div className="text-2xl font-bold text-white">{rank !== -1 ? `${rank + 1}.` : '-'}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-primary-light border-none">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <TrendingUp className="h-6 w-6 text-green-400 mb-2" />
            <div className="text-xs text-text-dim font-medium uppercase tracking-wider mb-1">Puan</div>
            <div className="text-2xl font-bold text-white">{myStanding?.points || 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-primary-light border-none col-span-2">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-accent/20 p-2 rounded-lg">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <div className="text-left">
                <div className="text-xs text-text-dim font-medium uppercase tracking-wider mb-0.5">Mevcut Kadro</div>
                <div className="text-lg font-bold text-white">45 / 53</div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/roster')}>
              Yönet <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Next Match Panel */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-accent" />
            Sıradaki Karşılaşma
          </h2>
        </div>
        
        {isMatchLoading ? (
          <Skeleton className="h-32 w-full rounded-2xl bg-white/5" />
        ) : match ? (
          <Card className="relative overflow-hidden border-accent/20 bg-gradient-to-r from-primary-light to-surface">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                
                {/* Home Team */}
                <div className="flex flex-col items-center w-1/3">
                  <div className="h-14 w-14 rounded-full bg-surface shadow-inner flex items-center justify-center border-2 border-white/10 mb-2">
                    <Shield className="h-7 w-7 text-text-dim" />
                  </div>
                  <div className="text-sm font-bold text-center leading-tight">
                    {match.home_franchise_id === franchise?.id ? 'SENİN TAKIMIN' : `Takım ${match.home_franchise_id.slice(0,4)}`}
                  </div>
                </div>

                {/* VS */}
                <div className="flex flex-col items-center justify-center px-4">
                  <div className="text-2xl font-black italic text-accent drop-shadow-[0_0_8px_rgba(232,93,4,0.5)]">VS</div>
                  <div className="text-[10px] text-text-dim mt-1 uppercase tracking-widest font-semibold bg-white/5 px-2 py-0.5 rounded-full">Bu Gece</div>
                </div>

                {/* Away Team */}
                <div className="flex flex-col items-center w-1/3">
                  <div className="h-14 w-14 rounded-full bg-surface shadow-inner flex items-center justify-center border-2 border-white/10 mb-2">
                    <Shield className="h-7 w-7 text-text-dim" />
                  </div>
                  <div className="text-sm font-bold text-center leading-tight">
                    {match.away_franchise_id === franchise?.id ? 'SENİN TAKIMIN' : `Takım ${match.away_franchise_id.slice(0,4)}`}
                  </div>
                </div>

              </div>
              
              <div className="mt-6 flex gap-2">
                <Button className="w-full" onClick={() => navigate('/tactics')}>Taktik Belirle</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed border-white/20 bg-white/5">
            <CardContent className="flex flex-col items-center justify-center p-8 text-center">
              <Activity className="h-8 w-8 text-text-dim mb-3 opacity-50" />
              <p className="text-text-dim font-medium">Şu an planlanmış bir maçınız bulunmuyor.</p>
              <p className="text-xs text-text-dim/70 mt-1">Sistem yakında fikstürü güncelleyecektir.</p>
            </CardContent>
          </Card>
        )}
      </section>
      
      <br/><br/>
    </div>
  )
}
