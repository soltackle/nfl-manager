import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import useSWR from 'swr'
import { supabase } from '@/lib/supabase'
import { Trophy, Activity, CloudLightning, Play } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'
import { motion, AnimatePresence } from 'framer-motion'

const TOUCHDOWN_SOUND = new Audio('/sounds/Touchdown.mp3')

const AnimatedPitch = ({ log }: { log: any }) => {
  if (!log) return null

  // 120 yards total: 10 EZ + 100 Field + 10 EZ
  // We represent X as a percentage from 0 to 100% of the container
  const getAbsoluteXPercentage = (yardLine: number, possession: string) => {
    const rawYards = possession === 'home' ? 10 + yardLine : 110 - yardLine
    return (rawYards / 120) * 100
  }

  // Fallbacks for old logs that don't have structured data
  if (!log.startYard || !log.possession) {
    return (
      <div className="relative w-full h-[120px] md:h-[200px] bg-[#2E7D32] rounded-xl overflow-hidden border-4 border-white/80 shadow-[inset_0_0_50px_rgba(0,0,0,0.8)] flex items-center justify-center">
         <div className="text-white/50 text-sm font-bold uppercase tracking-widest">Klasik Motor Logu (Görselleştirilemiyor)</div>
      </div>
    )
  }

  const startX = getAbsoluteXPercentage(log.startYard, log.possession)
  const endX = getAbsoluteXPercentage(log.endYard, log.possession)

  // Determine Y animation (parabola for passes, linear for runs)
  const isPass = log.playType === 'deep_bomb' || log.playType === 'short_pass'
  const isDeep = log.playType === 'deep_bomb' || log.playType === 'punt' || log.playType === 'fg'
  
  const yAnimation = isDeep ? ['50%', '10%', '50%'] : ['50%', '50%']
  const duration = isDeep ? 1.5 : 0.8

  return (
    <div className="relative w-full h-[120px] md:h-[200px] bg-[#2E7D32] rounded-xl overflow-hidden border-4 border-white/80 shadow-[inset_0_0_50px_rgba(0,0,0,0.8)] my-6">
      
      {/* Pitch Markings */}
      <div className="absolute inset-0 flex flex-col justify-between py-2">
        <div className="w-full h-px bg-white/20"></div>
        <div className="w-full h-px bg-white/20"></div>
        <div className="w-full h-px bg-white/20"></div>
        <div className="w-full h-px bg-white/20"></div>
        <div className="w-full h-px bg-white/20"></div>
      </div>

      <div className="absolute inset-0 flex justify-between items-center text-white/40 font-black text-xl md:text-3xl px-2">
        <div className="rotate-[-90deg] origin-center tracking-widest opacity-50">HOME</div>
        <div className="rotate-[90deg] origin-center tracking-widest opacity-50">AWAY</div>
      </div>

      {/* Yard Lines */}
      {Array.from({ length: 11 }).map((_, i) => {
        const yardNum = i * 10
        const isEndzone = yardNum === 0 || yardNum === 100
        const absolutePos = (10 + yardNum) / 120 * 100
        return (
          <div 
            key={i} 
            className={`absolute top-0 bottom-0 border-l ${isEndzone ? 'border-white border-2' : 'border-white/40 border-dashed'} flex flex-col justify-between py-1`}
            style={{ left: `${absolutePos}%` }}
          >
            {!isEndzone && <span className="text-white/60 text-[10px] md:text-xs font-bold -translate-x-1/2">{yardNum <= 50 ? yardNum : 100 - yardNum}</span>}
          </div>
        )
      })}

      {/* Endzones Colors */}
      <div className="absolute top-0 bottom-0 left-0 w-[8.33%] bg-blue-600/30"></div>
      <div className="absolute top-0 bottom-0 right-0 w-[8.33%] bg-orange-600/30"></div>

      {/* Line of Scrimmage */}
      <motion.div 
        initial={{ left: `${startX}%` }}
        animate={{ left: `${startX}%` }}
        className="absolute top-0 bottom-0 w-[2px] bg-blue-500 shadow-[0_0_10px_rgba(0,0,255,1)] z-10"
      />

      {/* The Ball */}
      <motion.div
        key={log.time + log.text} // Re-trigger animation on new log
        initial={{ left: `${startX}%`, top: '50%', scale: 1, rotate: 0 }}
        animate={{ 
          left: `${endX}%`, 
          top: yAnimation,
          rotate: isPass ? 720 : 180,
          scale: isDeep ? [1, 1.5, 1] : 1
        }}
        transition={{ duration, ease: "easeInOut" }}
        className="absolute w-4 h-4 md:w-6 md:h-6 -ml-2 md:-ml-3 -mt-2 md:-mt-3 z-20"
      >
        <span className="text-xl md:text-2xl drop-shadow-lg block leading-none">🏉</span>
      </motion.div>

      {/* Event Popups */}
      <AnimatePresence>
        {log.event && log.event !== 'incomplete' && (
          <motion.div
            key={`event-${log.time}`}
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: "spring", damping: 10, stiffness: 100, delay: duration * 0.8 }}
            className={`absolute top-1/4 -translate-y-1/2 z-30 font-black text-2xl md:text-4xl tracking-widest drop-shadow-[0_5px_5px_rgba(0,0,0,1)]
              ${log.event === 'touchdown' ? 'text-yellow-400' : 'text-red-500'}
            `}
            style={{ left: `calc(${endX}% - 50px)` }}
          >
            {log.event.toUpperCase()}!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function MatchResultPage() {
  const { id } = useParams()
  
  const [playbackState, setPlaybackState] = useState<'idle' | 'playing' | 'finished'>('idle')
  const [visibleLogs, setVisibleLogs] = useState<any[]>([])
  const [currentHomeScore, setCurrentHomeScore] = useState(0)
  const [currentAwayScore, setCurrentAwayScore] = useState(0)
  const [currentLog, setCurrentLog] = useState<any>(null)
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1)
  
  const currentIndexRef = useRef(0)
  const tempHomeScoreRef = useRef(0)
  const tempAwayScoreRef = useRef(0)
  
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
    if (id) {
      localStorage.setItem('lastViewedMatchId', id)
    }
  }, [id])

  useEffect(() => {
    if (playbackState === 'playing' && data?.logs) {
      const totalLogs = data.logs.length
      if (totalLogs === 0) {
        setPlaybackState('finished')
        setCurrentHomeScore(data.match.home_score)
        setCurrentAwayScore(data.match.away_score)
        return
      }

      const interval = setInterval(() => {
        if (currentIndexRef.current < totalLogs) {
          const log = data.logs[currentIndexRef.current]
          setVisibleLogs(prev => [...prev, log])
          setCurrentLog(log)
          
          const text = log.text || Object.values(log)[0] || ''
          const isHome = text.includes('Ev Sahibi') || log.possession === 'home'
          const isAway = text.includes('Deplasman') || log.possession === 'away'
          
          if (text.includes('TOUCHDOWN')) {
            try {
              TOUCHDOWN_SOUND.currentTime = 0
              TOUCHDOWN_SOUND.play().catch(e => console.log('Audio error:', e))
            } catch (e) {
              console.log('Audio catch:', e)
            }
            // Determine points: 6 (missed PAT or failed 2pt), 7 (normal), 8 (2-point success)
            let tdPoints = 7
            if (text.includes('2-POINT BAŞARILI')) tdPoints = 8
            else if (text.includes('2-POINT BAŞARISIZ') || text.includes('Ekstra Puan KAÇTI')) tdPoints = 6
            
            if (isHome) tempHomeScoreRef.current += tdPoints
            if (isAway) tempAwayScoreRef.current += tdPoints
          } else if (text.includes('FIELD GOAL')) {
            if (isHome) tempHomeScoreRef.current += 3
            if (isAway) tempAwayScoreRef.current += 3
          } else if (text.includes('Skor:')) {
            const matchHome = text.match(/Ev Sahibi takım sayıları buluyor\. Skor: (\d+)/)
            if (matchHome) tempHomeScoreRef.current = parseInt(matchHome[1])
            const matchAway = text.match(/Deplasman takımı cevap veriyor\. Skor: (\d+)/)
            if (matchAway) tempAwayScoreRef.current = parseInt(matchAway[1])
          }
          
          setCurrentHomeScore(tempHomeScoreRef.current)
          setCurrentAwayScore(tempAwayScoreRef.current)

          currentIndexRef.current++
        } else {
          clearInterval(interval)
          setPlaybackState('finished')
          setCurrentHomeScore(data.match.home_score)
          setCurrentAwayScore(data.match.away_score)
        }
      }, 2000 / playbackSpeed)

      return () => clearInterval(interval)
    }
  }, [playbackState, data, playbackSpeed])

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
          <div className="bg-[#00254c] border border-white/20 rounded-full px-6 py-1 mb-2 shadow-lg flex items-center gap-2">
            {playbackState === 'finished' ? (
              <Trophy className="w-4 h-4 text-yellow-400" />
            ) : (
              <Activity className="w-4 h-4 text-accent animate-pulse" />
            )}
            <span className="text-white font-display font-bold uppercase tracking-widest text-sm">
              {playbackState === 'finished' ? `HAFTA ${match.week} SONUCU` : 'MAÇ OYNANIYOR...'}
            </span>
          </div>

          {playbackState === 'playing' && (
            <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-full px-3 py-1 mt-2">
              <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest">HIZ:</span>
              {[1, 2, 4].map(speed => (
                <button
                  key={speed}
                  onClick={() => setPlaybackSpeed(speed)}
                  className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                    playbackSpeed === speed 
                      ? 'bg-accent text-black' 
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          )}
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

      {/* 2D Animated Pitch */}
      {playbackState === 'playing' && currentLog && (
        <AnimatedPitch log={currentLog} />
      )}
      
      {/* Play-by-play Logs */}
      <div>
        <div className="flex items-center gap-2 mb-4 px-2">
          <Activity className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-display font-bold text-white tracking-widest uppercase">Maç Özeti (Play-by-play)</h2>
        </div>
        
        <div className="space-y-3">
          {visibleLogs.length > 0 ? (
            visibleLogs.slice().reverse().map((log: any, i: number) => {
              const time = log.time || Object.keys(log)[0]
              const text = log.text || log[time]
              
              const isHighlight = text.includes('TOUCHDOWN') || text.includes('SIGNATURE PLAY') || text.includes('INTERCEPTION') || log.event
              
              return (
                <div 
                  key={i} 
                  className={`flex flex-col md:flex-row md:items-start gap-2 md:gap-4 p-4 rounded-xl border transition-all duration-500 animate-in fade-in slide-in-from-top-2
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
                    {isHighlight && log.event && (
                      <div className="mt-2 text-[10px] text-accent/80 uppercase tracking-widest font-bold">
                        -- {log.event} --
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
      
      {/* Match Stats Summary */}
      {playbackState === 'finished' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="bg-gradient-to-r from-[#00254c] to-[#00152b] rounded-xl border border-[#005c99]/50 p-6 mt-4">
            <h2 className="text-sm font-display font-bold text-accent uppercase mb-6 flex items-center gap-2">
              <Trophy className="w-4 h-4" /> Maç İstatistikleri
            </h2>
            {(() => {
              const allLogs = data?.logs || []
              const homeTDs = allLogs.filter((l: any) => l.possession === 'home' && l.event === 'touchdown').length
              const awayTDs = allLogs.filter((l: any) => l.possession === 'away' && l.event === 'touchdown').length
              const homeINTs = allLogs.filter((l: any) => l.possession === 'home' && l.event === 'interception').length
              const awayINTs = allLogs.filter((l: any) => l.possession === 'away' && l.event === 'interception').length
              const homeFumbles = allLogs.filter((l: any) => l.possession === 'home' && l.event === 'fumble').length
              const awayFumbles = allLogs.filter((l: any) => l.possession === 'away' && l.event === 'fumble').length
              const homeSacks = allLogs.filter((l: any) => l.possession === 'home' && l.event === 'sack').length
              const awaySacks = allLogs.filter((l: any) => l.possession === 'away' && l.event === 'sack').length
              const homeFG = allLogs.filter((l: any) => l.possession === 'home' && l.event === 'fg_good').length
              const awayFG = allLogs.filter((l: any) => l.possession === 'away' && l.event === 'fg_good').length
              const twoPointPlays = allLogs.filter((l: any) => l.text?.includes('2-POINT')).length
              const coachPredictions = allLogs.filter((l: any) => l.text?.includes('TAHMİN') || l.text?.includes('Okuma')).length

              const statRows = [
                { label: 'Touchdown', home: homeTDs, away: awayTDs, color: 'text-yellow-400' },
                { label: 'Field Goal', home: homeFG, away: awayFG, color: 'text-green-400' },
                { label: 'Interception', home: homeINTs, away: awayINTs, color: 'text-red-400' },
                { label: 'Fumble', home: homeFumbles, away: awayFumbles, color: 'text-red-400' },
                { label: 'Sack', home: homeSacks, away: awaySacks, color: 'text-purple-400' },
              ]

              return (
                <>
                  <div className="grid grid-cols-3 gap-2 text-center mb-2">
                    <div className="text-xs font-bold text-white/50 uppercase">{(match as any).home_franchise?.team_name}</div>
                    <div className="text-[10px] font-bold text-white/30 uppercase">İSTATİSTİK</div>
                    <div className="text-xs font-bold text-white/50 uppercase">{(match as any).away_franchise?.team_name}</div>
                  </div>
                  {statRows.map(row => (
                    <div key={row.label} className="grid grid-cols-3 gap-2 items-center py-2 border-b border-white/5">
                      <div className={`text-center font-display font-black text-xl ${row.home > row.away ? row.color : 'text-white/40'}`}>{row.home}</div>
                      <div className="text-center text-xs font-bold text-white/50 uppercase">{row.label}</div>
                      <div className={`text-center font-display font-black text-xl ${row.away > row.home ? row.color : 'text-white/40'}`}>{row.away}</div>
                    </div>
                  ))}
                  {(twoPointPlays > 0 || coachPredictions > 0) && (
                    <div className="flex justify-center gap-4 mt-4">
                      {twoPointPlays > 0 && (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2 text-center">
                          <div className="text-yellow-400 font-display font-black text-lg">{twoPointPlays}</div>
                          <div className="text-[9px] text-white/40 font-bold uppercase">2-Point Denemesi</div>
                        </div>
                      )}
                      {coachPredictions > 0 && (
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2 text-center">
                          <div className="text-blue-400 font-display font-black text-lg">{coachPredictions}</div>
                          <div className="text-[9px] text-white/40 font-bold uppercase">Koç Tahmini</div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )
            })()}
          </div>
          <div className="mt-6 text-center">
            <p className="text-white/50 font-bold uppercase tracking-widest text-sm mb-4">KARŞILAŞMA SONA ERDİ</p>
          </div>
        </div>
      )}
    </div>
  )
}
