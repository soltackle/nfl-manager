import { useAuthStore } from '@/store/authStore'
import { useFranchiseStore } from '@/store/franchiseStore'
import { useStandings } from '@/hooks/useStandings'
import { useMatches } from '@/hooks/useMatches'
import { Shield, Trophy, Target, TrendingUp, Star, Award, Calendar, Zap, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function ProfilePage() {
  const { user, profile, signOut } = useAuthStore()
  const { franchise } = useFranchiseStore()
  const { standings } = useStandings()
  const { matches } = useMatches()
  const navigate = useNavigate()

  const userStanding = standings.find(r => r.isUser)
  const userRank = standings.findIndex(r => r.isUser) + 1

  const playedMatches = matches.filter(m => m.final_stats?.played)
  const wins = playedMatches.filter(m => {
    const isHome = m.home_franchise_id === franchise?.id
    const my = isHome ? m.home_score : m.away_score
    const their = isHome ? m.away_score : m.home_score
    return my > their
  }).length

  const totalPF = playedMatches.reduce((acc, m) => {
    const isHome = m.home_franchise_id === franchise?.id
    return acc + (isHome ? m.home_score : m.away_score)
  }, 0)

  const winRate = playedMatches.length > 0 ? Math.round((wins / playedMatches.length) * 100) : 0

  const managerLevel = profile?.manager_xp ? Math.floor(profile.manager_xp / 100) + 1 : 1
  const xpProgress = profile?.manager_xp ? (profile.manager_xp % 100) : 0

  return (
    <div className="space-y-6 pt-4 max-w-3xl mx-auto">
      {/* Profile Header */}
      <div className="relative bg-gradient-to-br from-[#003366] via-[#00254c] to-[#001021] rounded-2xl border border-[#005c99] overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
        
        <div className="relative z-10 p-8 flex flex-col md:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent to-yellow-600 flex items-center justify-center shadow-[0_0_30px_rgba(255,156,0,0.4)]">
              <span className="text-4xl font-display font-black text-[#001021]">
                {(profile?.username || 'M')[0].toUpperCase()}
              </span>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-[#001021] border-2 border-accent rounded-full px-2 py-0.5">
              <span className="text-accent font-display font-black text-sm">LVL {managerLevel}</span>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-display font-black text-white uppercase tracking-wider">
              {profile?.username || user?.user_metadata?.username || 'Menajer'}
            </h1>
            <p className="text-accent text-sm font-bold uppercase mt-1">Baş Menajer</p>
            
            {/* XP Bar */}
            <div className="mt-4 max-w-xs mx-auto md:mx-0">
              <div className="flex justify-between text-[10px] font-bold text-white/50 mb-1">
                <span>XP İlerlemesi</span>
                <span>{xpProgress}/100 XP</span>
              </div>
              <div className="h-2 bg-[#001021] rounded-full overflow-hidden border border-white/10">
                <div 
                  className="h-full bg-gradient-to-r from-accent to-yellow-400 rounded-full transition-all" 
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-3">
            <div className="bg-[#001021] border border-[#005c99] rounded-xl p-3 text-center min-w-[70px]">
              <div className="text-[10px] font-bold text-white/50 uppercase">Sıra</div>
              <div className="font-display font-black text-2xl text-yellow-400">{userRank || '-'}</div>
            </div>
            <div className="bg-[#001021] border border-[#005c99] rounded-xl p-3 text-center min-w-[70px]">
              <div className="text-[10px] font-bold text-white/50 uppercase">Galibiyet</div>
              <div className="font-display font-black text-2xl text-green-400">{wins}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Info Card */}
      {franchise && (
        <div className="bg-gradient-to-r from-[#00152b] to-[#00254c] rounded-xl border border-[#005c99]/50 p-6">
          <div className="flex items-center gap-4 mb-6">
            <Shield className="w-12 h-12 text-accent" fill="currentColor" />
            <div>
              <h2 className="font-display font-black text-xl text-white uppercase tracking-wider">{franchise.team_name}</h2>
              <p className="text-white/50 text-sm">{franchise.city}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Trophy} label="Galibiyet Oranı" value={`%${winRate}`} color="text-accent" />
            <StatCard icon={Target} label="Atılan Sayı" value={`${totalPF}`} color="text-blue-400" />
            <StatCard icon={Calendar} label="Maç Oynanmış" value={`${playedMatches.length}`} color="text-purple-400" />
            <StatCard icon={TrendingUp} label="Sayı Farkı" value={userStanding ? `${userStanding.point_diff > 0 ? '+' : ''}${userStanding.point_diff}` : '0'} color={userStanding && userStanding.point_diff > 0 ? 'text-green-400' : 'text-red-400'} />
          </div>
        </div>
      )}

      {/* Achievements / Badges */}
      <div className="bg-gradient-to-r from-[#00254c] to-[#00152b] rounded-xl border border-[#004b93]/50 p-6">
        <h2 className="text-sm font-display font-bold text-accent uppercase mb-4 flex items-center gap-2">
          <Award className="w-4 h-4" /> Başarımlar
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <AchievementBadge 
            icon={Star} 
            label="İlk Galibiyet" 
            unlocked={wins >= 1} 
          />
          <AchievementBadge 
            icon={Zap} 
            label="5 Galibiyet" 
            unlocked={wins >= 5} 
          />
          <AchievementBadge 
            icon={Trophy} 
            label="Lider" 
            unlocked={userRank === 1} 
          />
          <AchievementBadge 
            icon={Target} 
            label="100+ Sayı" 
            unlocked={totalPF >= 100} 
          />
        </div>
      </div>

      {/* Season Record */}
      {userStanding && (
        <div className="bg-gradient-to-r from-[#00254c] to-[#00152b] rounded-xl border border-[#004b93]/50 p-6">
          <h2 className="text-sm font-display font-bold text-accent uppercase mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Sezon Özeti
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[#001021] rounded-xl p-4 text-center border border-green-500/20">
              <div className="font-display font-black text-4xl text-green-400">{userStanding.wins}</div>
              <div className="text-[10px] font-bold text-white/50 uppercase mt-1">Galibiyet</div>
            </div>
            <div className="bg-[#001021] rounded-xl p-4 text-center border border-red-500/20">
              <div className="font-display font-black text-4xl text-red-400">{userStanding.losses}</div>
              <div className="text-[10px] font-bold text-white/50 uppercase mt-1">Mağlubiyet</div>
            </div>
            <div className="bg-[#001021] rounded-xl p-4 text-center border border-white/10">
              <div className="font-display font-black text-4xl text-white/40">{userStanding.ties}</div>
              <div className="text-[10px] font-bold text-white/50 uppercase mt-1">Beraberlik</div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <button 
          onClick={() => navigate('/slots')} 
          className="flex-1 bg-[#00254c] hover:bg-[#003366] text-white font-display font-bold uppercase py-4 rounded-xl border border-[#005c99] transition-colors"
        >
          🔄 Kariyer Değiştir
        </button>
        <button 
          onClick={() => signOut()} 
          className="bg-red-500/20 hover:bg-red-500/30 text-red-400 font-display font-bold uppercase px-6 py-4 rounded-xl border border-red-500/30 transition-colors flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" /> Çıkış
        </button>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }: { icon: unknown; label: string; value: string; color: string }) {
  return (
    <div className="bg-[#001021] border border-white/5 rounded-xl p-4 text-center">
      <Icon className={`w-5 h-5 mx-auto mb-2 ${color}`} />
      <div className={`font-display font-black text-xl ${color}`}>{value}</div>
      <div className="text-[9px] font-bold text-white/50 uppercase mt-1">{label}</div>
    </div>
  )
}

function AchievementBadge({ icon: Icon, label, unlocked }: { icon: unknown; label: string; unlocked: boolean }) {
  return (
    <div className={`rounded-xl p-4 text-center border transition-all ${
      unlocked 
        ? 'bg-accent/10 border-accent/30 shadow-[0_0_15px_rgba(255,156,0,0.15)]' 
        : 'bg-[#001021] border-white/5 opacity-40'
    }`}>
      <Icon className={`w-8 h-8 mx-auto mb-2 ${unlocked ? 'text-accent' : 'text-white/20'}`} />
      <div className={`text-[10px] font-bold uppercase ${unlocked ? 'text-accent' : 'text-white/30'}`}>{label}</div>
      {unlocked && <div className="text-[8px] text-green-400 font-bold mt-1">✓ AÇILDI</div>}
    </div>
  )
}
