import { useState } from 'react'
import { useMatches } from '@/hooks/useMatches'
import { useStandings } from '@/hooks/useStandings'
import { useFranchiseStore } from '@/store/franchiseStore'
import { Calendar, Shield, MapPin, ChevronRight, Trophy, BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'

type Tab = 'standings' | 'fixture'

export function MatchesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('standings')
  const { matches, isLoading: matchLoading } = useMatches()
  const { standings, isLoading: standingsLoading } = useStandings()
  const { franchise } = useFranchiseStore()

  const isLoading = matchLoading || standingsLoading

  if (isLoading) {
    return (
      <div className="space-y-4 pt-4">
        <Skeleton className="h-16 w-full bg-[#00152b] rounded-xl" />
        <Skeleton className="h-96 w-full bg-[#00152b] rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pt-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#00152b] to-[#00254c] rounded-xl p-6 border border-[#005c99] flex items-center gap-6 shadow-xl">
        <div className="p-4 bg-[#001021] rounded-xl text-accent border border-[#005c99]">
          <Trophy className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-black text-white uppercase tracking-wider">LİG MERKEZİ</h1>
          <p className="text-white/50 mt-1">Puan tablosu, fikstür ve sezon takibi</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#001021] p-1 rounded-xl border border-white/10">
        <button
          onClick={() => setActiveTab('standings')}
          className={`flex-1 py-3 rounded-lg font-display font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            activeTab === 'standings'
              ? 'bg-accent text-[#001021] shadow-lg'
              : 'text-white/50 hover:text-white hover:bg-white/5'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Puan Tablosu
        </button>
        <button
          onClick={() => setActiveTab('fixture')}
          className={`flex-1 py-3 rounded-lg font-display font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            activeTab === 'fixture'
              ? 'bg-accent text-[#001021] shadow-lg'
              : 'text-white/50 hover:text-white hover:bg-white/5'
          }`}
        >
          <Calendar className="w-4 h-4" /> Fikstür
        </button>
      </div>

      {/* TAB: STANDINGS */}
      {activeTab === 'standings' && (
        <div className="bg-gradient-to-b from-[#00152b] to-[#001021] rounded-xl border border-[#005c99]/50 overflow-hidden shadow-xl">
          {/* Table Header */}
          <div className="bg-[#00254c] px-4 py-3 border-b border-[#005c99]">
            <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-white/50 uppercase tracking-wider">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-3">Takım</div>
              <div className="col-span-1 text-center">G</div>
              <div className="col-span-1 text-center">M</div>
              <div className="col-span-1 text-center">B</div>
              <div className="col-span-1 text-center">AS</div>
              <div className="col-span-1 text-center">YS</div>
              <div className="col-span-1 text-center">FARK</div>
              <div className="col-span-2 text-center">SERİ</div>
            </div>
          </div>

          {/* Table Body */}
          <div>
            {standings.map((row, idx) => {
              const rank = idx + 1
              let rankColor = 'text-white/50'
              let rankBg = ''
              if (rank === 1) { rankColor = 'text-yellow-400'; rankBg = 'bg-yellow-500/10' }
              else if (rank === 2) { rankColor = 'text-gray-300'; rankBg = 'bg-gray-500/5' }
              else if (rank === 3) { rankColor = 'text-amber-600'; rankBg = 'bg-amber-500/5' }

              const isUserTeam = row.isUser
              const streakLetter = row.streak.slice(-1)
              let streakColor = 'text-white/40'
              let StreakIcon = Minus
              if (streakLetter === 'W') { streakColor = 'text-green-400'; StreakIcon = TrendingUp }
              else if (streakLetter === 'L') { streakColor = 'text-red-400'; StreakIcon = TrendingDown }

              return (
                <div
                  key={row.franchise_id}
                  className={`grid grid-cols-12 gap-2 items-center px-4 py-3 border-b border-white/5 transition-colors hover:bg-white/5 ${
                    isUserTeam ? 'bg-accent/10 border-l-4 border-l-accent' : rankBg
                  }`}
                >
                  {/* Rank */}
                  <div className={`col-span-1 text-center font-display font-black text-lg ${rankColor}`}>
                    {rank}
                  </div>

                  {/* Team Name */}
                  <div className="col-span-3 flex items-center gap-2">
                    <Shield className={`w-5 h-5 flex-shrink-0 ${isUserTeam ? 'text-accent' : 'text-white/30'}`} fill="currentColor" />
                    <span className={`font-bold text-sm truncate ${isUserTeam ? 'text-accent' : 'text-white'}`}>
                      {row.team_name}
                    </span>
                    {isUserTeam && <span className="text-[8px] bg-accent text-[#001021] px-1.5 py-0.5 rounded font-bold flex-shrink-0">SİZ</span>}
                  </div>

                  {/* W */}
                  <div className="col-span-1 text-center font-display font-black text-green-400">{row.wins}</div>
                  {/* L */}
                  <div className="col-span-1 text-center font-display font-black text-red-400">{row.losses}</div>
                  {/* T */}
                  <div className="col-span-1 text-center font-display font-black text-white/40">{row.ties}</div>
                  {/* PF */}
                  <div className="col-span-1 text-center text-xs font-bold text-white/60">{row.points_for}</div>
                  {/* PA */}
                  <div className="col-span-1 text-center text-xs font-bold text-white/60">{row.points_against}</div>
                  {/* Diff */}
                  <div className={`col-span-1 text-center text-xs font-bold ${row.point_diff > 0 ? 'text-green-400' : row.point_diff < 0 ? 'text-red-400' : 'text-white/40'}`}>
                    {row.point_diff > 0 ? '+' : ''}{row.point_diff}
                  </div>
                  {/* Streak */}
                  <div className={`col-span-2 text-center flex items-center justify-center gap-1 ${streakColor}`}>
                    <StreakIcon className="w-3 h-3" />
                    <span className="text-xs font-bold">{row.streak}</span>
                  </div>
                </div>
              )
            })}

            {standings.length === 0 && (
              <div className="text-center text-white/30 font-bold uppercase py-10">
                <Trophy className="w-10 h-10 mx-auto mb-3 opacity-50" />
                Henüz maç oynanmadı. Fikstür bekleniyor.
              </div>
            )}
          </div>

          {/* Footer Legend */}
          <div className="px-4 py-3 bg-[#00254c]/50 border-t border-[#005c99]/30 flex flex-wrap gap-4 text-[10px] text-white/40 font-bold uppercase">
            <span>G = Galibiyet</span>
            <span>M = Mağlubiyet</span>
            <span>B = Beraberlik</span>
            <span>AS = Atılan Sayı</span>
            <span>YS = Yenilen Sayı</span>
            <span>FARK = Sayı Farkı</span>
          </div>
        </div>
      )}

      {/* TAB: FIXTURE */}
      {activeTab === 'fixture' && (
        <div className="space-y-4">
          {matches.map((match) => {
            const isHome = match.home_franchise_id === franchise?.id
            const opponentName = isHome ? (match as unknown).away_franchise?.team_name : (match as unknown).home_franchise?.team_name
            const isPlayed = !!match.final_stats?.played
            
            let resultClass = 'border-white/10 bg-[#00152b]'
            let resultText = ''
            if (isPlayed) {
              const myScore = isHome ? match.home_score : match.away_score
              const theirScore = isHome ? match.away_score : match.home_score
              if (myScore > theirScore) {
                resultClass = 'border-green-500/50 bg-green-500/10'
                resultText = 'GALİBİYET'
              } else if (myScore < theirScore) {
                resultClass = 'border-red-500/50 bg-red-500/10'
                resultText = 'MAĞLUBİYET'
              } else {
                resultClass = 'border-yellow-500/50 bg-yellow-500/10'
                resultText = 'BERABERLİK'
              }
            }

            return (
              <div key={match.id} className={`flex flex-col md:flex-row md:items-center justify-between p-6 rounded-xl border transition-all hover:bg-white/5 ${resultClass}`}>
                <div className="flex items-center gap-6 mb-4 md:mb-0">
                  <div className="text-center w-16">
                    <div className="text-xs font-bold text-white/50 uppercase">Hafta</div>
                    <div className="font-display font-black text-3xl text-white">{match.week}</div>
                  </div>
                  
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${isHome ? 'bg-accent/20 text-accent border border-accent/30' : 'bg-white/10 text-white/50 border border-white/20'}`}>
                        {isHome ? 'EV SAHİBİ' : 'DEPLASMAN'}
                      </span>
                      {isPlayed && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          resultText === 'GALİBİYET' ? 'text-green-400 bg-green-400/20' : 
                          resultText === 'MAĞLUBİYET' ? 'text-red-400 bg-red-400/20' : 
                          'text-yellow-400 bg-yellow-400/20'
                        }`}>
                          {resultText}
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-xl text-white flex items-center gap-2">
                      <Shield className="w-5 h-5 text-white/30" />
                      {opponentName}
                    </div>
                    <div className="text-xs text-white/50 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />
                      {isHome ? franchise?.city || 'Stadyumunuz' : 'Deplasman'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-8 md:w-1/3">
                  {isPlayed ? (
                    <div className="text-center flex-1">
                      <div className="text-[10px] font-bold text-white/50 uppercase mb-1">SKOR</div>
                      <div className="font-display font-black text-3xl text-white tracking-wider flex items-center justify-center gap-3">
                        <span className={isHome ? 'text-accent' : 'text-white/60'}>{match.home_score}</span>
                        <span className="text-white/20">-</span>
                        <span className={!isHome ? 'text-accent' : 'text-white/60'}>{match.away_score}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center flex-1 opacity-50">
                      <div className="text-[10px] font-bold text-white/50 uppercase mb-1">DURUM</div>
                      <div className="font-display font-bold text-lg text-white">OYNANMADI</div>
                    </div>
                  )}
                  
                  {isPlayed ? (
                    <a href={`/match/${match.id}`} className="bg-[#00254c] hover:bg-accent hover:text-[#001021] text-accent p-3 rounded-lg transition-colors border border-accent/20">
                      <ChevronRight className="w-6 h-6" />
                    </a>
                  ) : (
                    <button disabled className="bg-white/5 text-white/20 p-3 rounded-lg cursor-not-allowed">
                      <Calendar className="w-6 h-6" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
          
          {matches.length === 0 && !isLoading && (
            <div className="text-center text-white/30 font-bold uppercase py-10 bg-[#00152b] border border-white/5 rounded-xl">
              <Trophy className="w-10 h-10 mx-auto mb-3 opacity-50" />
              Henüz fikstür oluşturulmadı. Draftın tamamlanmasını bekleyin.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
