import { useParams } from 'react-router-dom'
import useSWR from 'swr'
import { supabase } from '@/lib/supabase'
import { Trophy, Activity, CloudLightning } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'

export function MatchResultPage() {
  const { id } = useParams()
  
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

  if (isLoading) return (
    <div className="space-y-4 pt-4">
      <Skeleton className="h-48 w-full bg-white/5 rounded-xl" />
      <Skeleton className="h-[400px] w-full bg-white/5 rounded-xl" />
    </div>
  )
  
  if (!data?.match) return <div className="text-center mt-10 text-white/50">Maç bulunamadı.</div>

  const { match, logs } = data

  return (
    <div className="space-y-6 pt-4 max-w-4xl mx-auto pb-20">
      
      {/* Scoreboard */}
      <div className="relative w-full rounded-xl bg-gradient-to-b from-[#004b93] to-[#001f40] border border-[#005c99] shadow-2xl overflow-hidden p-8">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
        
        <div className="relative z-10 flex flex-col items-center mb-4">
          <div className="bg-[#00254c] border border-white/20 rounded-full px-6 py-1 mb-4 shadow-lg flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="text-white font-display font-bold uppercase tracking-widest text-sm">HAFTA {match.week} SONUCU</span>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between max-w-2xl mx-auto">
          {/* Home */}
          <div className="flex flex-col items-center w-1/3">
            <div className="text-white font-display font-black text-xl uppercase tracking-wide text-center">
              {(match as any).home_franchise?.team_name || 'Ev Sahibi'}
            </div>
          </div>

          {/* Score */}
          <div className="flex items-center justify-center gap-4">
            <div className="bg-black/50 border-2 border-[#00a2ff] rounded-lg px-6 py-4 shadow-[0_0_20px_rgba(0,162,255,0.3)]">
              <span className="text-5xl font-display font-black text-white">{match.home_score}</span>
            </div>
            <div className="text-white/30 font-bold text-2xl">-</div>
            <div className="bg-black/50 border-2 border-accent rounded-lg px-6 py-4 shadow-[0_0_20px_rgba(255,156,0,0.3)]">
              <span className="text-5xl font-display font-black text-white">{match.away_score}</span>
            </div>
          </div>

          {/* Away */}
          <div className="flex flex-col items-center w-1/3">
            <div className="text-white font-display font-black text-xl uppercase tracking-wide text-center">
              {(match as any).away_franchise?.team_name || 'Deplasman'}
            </div>
          </div>
        </div>
      </div>
      
      {/* Drive Logs */}
      <div>
        <div className="flex items-center gap-2 mb-4 px-2">
          <Activity className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-display font-bold text-white tracking-widest uppercase">Maç Özeti (Play-by-play)</h2>
        </div>
        
        <div className="space-y-3">
          {logs.length > 0 ? (
            logs.map((log: any, i: number) => {
              const key = Object.keys(log)[0]
              const val = log[key]
              return (
                <div key={i} className="flex items-start gap-4 p-4 bg-gradient-to-r from-[#00152b] to-[#001021] rounded-xl border border-white/5 hover:border-[#005c99]/50 transition-colors">
                  <div className="flex-shrink-0 bg-white/5 border border-white/10 rounded-lg px-3 py-1 mt-0.5">
                    <span className="text-accent font-bold text-xs uppercase">{key}</span>
                  </div>
                  <div>
                    <p className="text-white text-sm">{val}</p>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center py-10 bg-[#00152b] rounded-xl border border-white/5 text-white/50">
              <CloudLightning className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>Bu maç için özet kaydı bulunamadı.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
