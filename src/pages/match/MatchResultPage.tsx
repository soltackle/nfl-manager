import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import useSWR from 'swr'
import { supabase } from '@/lib/supabase'
import { Trophy, Activity, CloudLightning, Play } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'

const TOUCHDOWN_SOUND = new Audio('/sounds/Touchdown.mp3')

export function MatchResultPage() {
  const { id } = useParams()
  
  const [playbackState, setPlaybackState] = useState<'idle' | 'playing' | 'finished'>('idle')
  const [visibleLogs, setVisibleLogs] = useState<any[]>([])
  const [currentHomeScore, setCurrentHomeScore] = useState(0)
  const [currentAwayScore, setCurrentAwayScore] = useState(0)
  
  const fetcher = async () => {
    if (!id) return null
    const { data: matchData, error: matchErr } = await supabase
      .from('matches')
      .select('*, home_franchise:franchises!matches_home_franchise_id_fkey(team_name), away_franchise:franchises!matches_away_franchise_id_fkey(team_name)')
      .eq('id', id)
      .single()
      
    if (matchErr) throw matchErr

    const { data: logsData } = await supabase
      .from('match_drive_logs')
      .select('*')
      .eq('match_id', id)
      .limit(1)
      .maybeSingle()
      
    return { match: matchData, logs: logsData?.plays || [] }
  }

  const { data, isLoading } = useSWR(
    id ? `match-result-${id}` : null,
    fetcher
  )

  useEffect(() => {
    if (playbackState === 'playing' && data?.logs) {
      const totalLogs = data.logs.length
      if (totalLogs === 0) {
        setPlaybackState('finished')
        setCurrentHomeScore(data.match.home_score)
        setCurrentAwayScore(data.match.away_score)
        return
      }

      let currentIndex = 0
      let tempHomeScore = 0
      let tempAwayScore = 0

      const interval = setInterval(() => {
        if (currentIndex < totalLogs) {
          const log = data.logs[currentIndex]
          setVisibleLogs(prev => [...prev, log])
          
          const text = log.text || Object.values(log)[0] || ''
          const isHome = text.includes('Ev Sahibi')
          const isAway = text.includes('Deplasman')
          
          if (text.includes('TOUCHDOWN')) {
            try {
              TOUCHDOWN_SOUND.currentTime = 0
              TOUCHDOWN_SOUND.play().catch(e => console.log('Audio error:', e))
            } catch (e) {
              console.log('Audio catch:', e)
            }
            if (isHome) tempHomeScore += 7
            if (isAway) tempAwayScore += 7
          } else if (text.includes('FIELD GOAL')) {
            if (isHome) tempHomeScore += 3
            if (isAway) tempAwayScore += 3
          } else if (text.includes('Skor:')) {
            // Fallback for old engine format
            const matchHome = text.match(/Ev Sahibi takım sayıları buluyor\. Skor: (\d+)/)
            if (matchHome) tempHomeScore = parseInt(matchHome[1])
            const matchAway = text.match(/Deplasman takımı cevap veriyor\. Skor: (\d+)/)
            if (matchAway) tempAwayScore = parseInt(matchAway[1])
          }
          
          setCurrentHomeScore(tempHomeScore)
          setCurrentAwayScore(tempAwayScore)

          currentIndex++
        } else {
          clearInterval(interval)
          setPlaybackState('finished')
          // Set exact final score at the end
          setCurrentHomeScore(data.match.home_score)
          setCurrentAwayScore(data.match.away_score)
        }
      }, 800) // 0.8 seconds per log for faster down-by-down pace

      return () => clearInterval(interval)
    }
  }, [playbackState, data])

  if (isLoading) return (
    <div className="space-y-4 pt-4 max-w-4xl mx-auto px-4">
      <Skeleton className="h-48 w-full bg-white/5 rounded-xl" />
      <Skeleton className="h-[400px] w-full bg-white/5 rounded-xl" />
    </div>
  )
  
  if (!data?.match) return <div className="text-center mt-10 text-white/50">Maç bulunamadı.</div>

  const { match } = data

  if (playbackState === 'idle') {
    return (
      <div className="space-y-6 pt-4 max-w-4xl mx-auto pb-20 px-4 text-center">
         <div className="bg-[#00152b] border border-[#005c99]/50 rounded-xl p-8 md:p-12 mt-10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
           <Trophy className="w-16 h-16 text-white/20 mx-auto mb-6" />
           <h1 className="text-3xl font-display font-black text-white mb-2 uppercase tracking-wider">MAÇ GÜNÜ</h1>
           <p className="text-white/50 mb-10 font-bold uppercase tracking-widest text-xs">Hafta {match.week} Karşılaşması</p>
           
           <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 mb-12">
             <div className="text-2xl font-display font-bold text-white text-center md:text-right md:w-1/3">
               {(match as any).home_franchise?.team_name || 'Ev Sahibi'}
             </div>
             <div className="bg-black/50 border border-white/10 rounded-full px-4 py-2">
               <span className="text-accent font-black text-xl tracking-widest">VS</span>
             </div>
             <div className="text-2xl font-display font-bold text-white text-center md:text-left md:w-1/3">
               {(match as any).away_franchise?.team_name || 'Deplasman'}
             </div>
           </div>

           <button 
             onClick={() => setPlaybackState('playing')}
             className="osm-button bg-green-600 hover:bg-green-500 text-xl py-5 px-12 inline-flex items-center gap-3 animate-[pulse_2s_ease-in-out_infinite]"
           >
             <Play className="w-6 h-6 fill-current" /> MAÇI OYNAT
           </button>
         </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pt-4 max-w-4xl mx-auto pb-20 px-4">
      
      {/* Scoreboard */}
      <div className="relative w-full rounded-xl bg-gradient-to-b from-[#004b93] to-[#001f40] border border-[#005c99] shadow-2xl overflow-hidden p-6 md:p-8 transition-all duration-500">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
        
        <div className="relative z-10 flex flex-col items-center mb-4">
          <div className="bg-[#00254c] border border-white/20 rounded-full px-6 py-1 mb-4 shadow-lg flex items-center gap-2">
            {playbackState === 'finished' ? (
              <Trophy className="w-4 h-4 text-yellow-400" />
            ) : (
              <Activity className="w-4 h-4 text-accent animate-pulse" />
            )}
            <span className="text-white font-display font-bold uppercase tracking-widest text-sm">
              {playbackState === 'finished' ? `HAFTA ${match.week} SONUCU` : 'MAÇ OYNANIYOR...'}
            </span>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between max-w-2xl mx-auto">
          {/* Home */}
          <div className="flex flex-col items-center w-1/3">
            <div className="text-white font-display font-black text-lg md:text-xl uppercase tracking-wide text-center">
              {(match as any).home_franchise?.team_name || 'Ev Sahibi'}
            </div>
          </div>

          {/* Score */}
          <div className="flex items-center justify-center gap-2 md:gap-4">
            <div className={`bg-black/50 border-2 rounded-lg px-4 py-3 md:px-6 md:py-4 shadow-[0_0_20px_rgba(0,162,255,0.3)] transition-colors duration-300 ${playbackState === 'finished' && match.home_score > match.away_score ? 'border-[#00a2ff]' : 'border-white/10'}`}>
              <span className="text-4xl md:text-5xl font-display font-black text-white">{currentHomeScore}</span>
            </div>
            <div className="text-white/30 font-bold text-xl md:text-2xl">-</div>
            <div className={`bg-black/50 border-2 rounded-lg px-4 py-3 md:px-6 md:py-4 shadow-[0_0_20px_rgba(255,156,0,0.3)] transition-colors duration-300 ${playbackState === 'finished' && match.away_score > match.home_score ? 'border-accent' : 'border-white/10'}`}>
              <span className="text-4xl md:text-5xl font-display font-black text-white">{currentAwayScore}</span>
            </div>
          </div>

          {/* Away */}
          <div className="flex flex-col items-center w-1/3">
            <div className="text-white font-display font-black text-lg md:text-xl uppercase tracking-wide text-center">
              {(match as any).away_franchise?.team_name || 'Deplasman'}
            </div>
          </div>
        </div>
      </div>
      
      {/* Play-by-play Logs */}
      <div>
        <div className="flex items-center gap-2 mb-4 px-2">
          <Activity className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-display font-bold text-white tracking-widest uppercase">Maç Özeti (Play-by-play)</h2>
        </div>
        
        <div className="space-y-3">
          {visibleLogs.length > 0 ? (
            visibleLogs.map((log: any, i: number) => {
              const time = log.time || Object.keys(log)[0]
              const text = log.text || log[time]
              
              const isHighlight = text.includes('TOUCHDOWN') || text.includes('SIGNATURE PLAY') || text.includes('INTERCEPTION')
              
              return (
                <div 
                  key={i} 
                  className={`flex flex-col md:flex-row md:items-start gap-2 md:gap-4 p-4 rounded-xl border transition-all duration-500 animate-in fade-in slide-in-from-bottom-2
                    ${isHighlight 
                      ? 'bg-gradient-to-r from-accent/20 to-black/40 border-accent shadow-[0_0_15px_rgba(255,156,0,0.2)]' 
                      : 'bg-gradient-to-r from-[#00152b] to-[#001021] border-white/5'
                    }
                  `}
                >
                  <div className={`flex-shrink-0 border rounded-lg px-3 py-1 mt-0.5 inline-block text-center ${isHighlight ? 'bg-accent/10 border-accent/30' : 'bg-white/5 border-white/10'}`}>
                    <span className={`font-bold text-xs uppercase ${isHighlight ? 'text-accent' : 'text-white/70'}`}>{time}</span>
                  </div>
                  <div>
                    <p className={`text-sm md:text-base ${isHighlight ? 'text-white font-bold' : 'text-white/80'}`}>{text}</p>
                    {/* Placeholder for special highlights UI in the future */}
                    {isHighlight && (
                      <div className="mt-2 text-[10px] text-accent/60 uppercase tracking-widest font-bold">
                        -- HIGHLIGHT OLAYI --
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center py-10 bg-[#00152b] rounded-xl border border-white/5 text-white/50">
              <CloudLightning className="w-10 h-10 mx-auto mb-2 opacity-30 animate-pulse" />
              <p>Maç oynanıyor, takımlar sahada...</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Finished State Action */}
      {playbackState === 'finished' && (
        <div className="mt-8 text-center animate-in fade-in zoom-in duration-500">
          <p className="text-white/50 font-bold uppercase tracking-widest text-sm mb-4">KARŞILAŞMA SONA ERDİ</p>
        </div>
      )}
    </div>
  )
}
