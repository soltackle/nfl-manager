import { useMatches } from '@/hooks/useMatches'
import { useFranchiseStore } from '@/store/franchiseStore'
import { Calendar, Shield, MapPin, ChevronRight, Trophy } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'

export function MatchesPage() {
  const { matches, isLoading } = useMatches()
  const { franchise } = useFranchiseStore()

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
          <Calendar className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-black text-white uppercase tracking-wider">SEZON FİKSTÜRÜ</h1>
          <p className="text-white/50 mt-1">Normal sezon karşılaşmaları ve sonuçları</p>
        </div>
      </div>

      {/* Match List */}
      <div className="space-y-4">
        {matches.map((match) => {
          const isHome = match.home_franchise_id === franchise?.id
          const opponentName = isHome ? (match as any).away_franchise?.team_name : (match as any).home_franchise?.team_name
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
    </div>
  )
}
