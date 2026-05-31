import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useFranchiseStore } from '@/store/franchiseStore'
import { supabase } from '@/lib/supabase'
import { Users, Clock, ShieldAlert } from 'lucide-react'

export function LeagueLobbyPage() {
  const { user } = useAuthStore()
  const { activeFranchiseId, franchise, league, setLeague } = useFranchiseStore()
  const navigate = useNavigate()

  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!league || !franchise) return
    
    // Fetch members initially
    fetchMembers()

    // Realtime subscription for franchises in this league
    const channel = supabase.channel(`league-${league.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'franchises', filter: `league_id=eq.${league.id}` },
        () => {
          fetchMembers()
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'leagues', filter: `id=eq.${league.id}` },
        (payload) => {
          // If status changes to draft, redirect
          setLeague(payload.new as any)
          if (payload.new.status === 'draft') {
            navigate('/draft')
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [league?.id])

  const fetchMembers = async () => {
    if (!league) return
    const { data } = await supabase
      .from('franchises')
      .select('id, user_id, team_name, city, users(username)')
      .eq('league_id', league.id)
    
    if (data) setMembers(data)
    setLoading(false)
  }

  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  useEffect(() => {
    if (members.length === 8 && league?.match_time_utc) {
      // Calculate once immediately
      const updateTimer = () => {
        try {
          const now = new Date()
          // Robust parsing of time string (e.g. "20:00:00" or "20:00" or "20:00:00+00")
          const timeStr = league.match_time_utc || '20:00:00'
          const parts = timeStr.split(':')
          const hours = parseInt(parts[0] || '20', 10)
          const minutes = parseInt(parts[1] || '0', 10)
          
          if (isNaN(hours) || isNaN(minutes)) {
            setTimeLeft(0)
            return
          }
          
          const target = new Date()
          target.setUTCHours(hours, minutes, 0, 0)
          
          if (target.getTime() <= now.getTime()) {
            // If it's past the time today, target is tomorrow
            target.setUTCDate(target.getUTCDate() + 1)
          }
          
          const diff = target.getTime() - now.getTime()
          if (diff <= 0) {
            setTimeLeft(0)
          } else {
            setTimeLeft(diff)
          }
        } catch (e) {
          console.error("Timer error:", e)
          setTimeLeft(0)
        }
      }
      
      updateTimer()
      const interval = setInterval(updateTimer, 1000)
      return () => clearInterval(interval)
    } else {
      setTimeLeft(null)
    }
  }, [members.length, league?.match_time_utc])

  if (!league || !franchise) return null

  const isDraftCountdown = members.length === 8

  const formatTime = (ms: number | null) => {
    if (ms === null) return "00:00"
    const totalSeconds = Math.floor(ms / 1000)
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    const s = totalSeconds % 60
    if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-[#001021] text-white flex items-center justify-center p-6 relative overflow-hidden">
      <div className="max-w-3xl w-full bg-[#00152b] border border-[#005c99] rounded-xl p-8 relative z-10 shadow-2xl">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-black tracking-widest text-white uppercase mb-2">
            LOBİ: {league.name}
          </h1>
          <p className="text-accent text-sm font-bold uppercase flex items-center justify-center gap-2">
            <Users className="w-4 h-4" /> 
            {members.length} / 8 OYUNCU
          </p>
        </div>

        {isDraftCountdown ? (
          <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-6 mb-8 text-center">
            <h2 className="text-xl font-display font-black text-red-500 uppercase tracking-widest mb-2 flex justify-center items-center gap-2">
              <Clock className="w-6 h-6 animate-pulse" /> DRAFT BEKLENİYOR
            </h2>
            <p className="text-white/70 text-sm font-bold uppercase mb-4">Lütfen sayfadan ayrılmayın, belirtilen maç saatinde draft başlayacaktır.</p>
            <div className="text-5xl font-mono font-black text-white">{formatTime(timeLeft)}</div>
          </div>
        ) : (
          <div className="bg-[#001021] border border-white/5 rounded-xl p-6 mb-8 text-center">
            <h2 className="text-lg font-display font-bold text-white/50 uppercase tracking-widest mb-2 flex justify-center items-center gap-2">
              <Clock className="w-5 h-5" /> OYUNCU BEKLENİYOR...
            </h2>
            <p className="text-white/40 text-xs font-bold uppercase">
              Ligin dolması veya komisyonerin başlatması bekleniyor.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {members.map(m => (
            <div key={m.id} className={`p-4 rounded-lg border ${m.id === activeFranchiseId ? 'bg-accent/10 border-accent' : 'bg-[#001021] border-[#004b93]'}`}>
              <div className="text-xs text-white/40 font-bold uppercase mb-1">
                {m.id === activeFranchiseId ? 'SİZ' : (m.users?.username || 'Menajer')}
              </div>
              <div className={`font-display font-black uppercase text-sm ${m.id === activeFranchiseId ? 'text-accent' : 'text-white'}`}>
                {m.city} {m.team_name.replace(' Team', '')}
              </div>
            </div>
          ))}
          
          {Array.from({ length: 8 - members.length }).map((_, i) => (
            <div key={i} className="p-4 rounded-lg border border-dashed border-white/10 bg-[#001021]/50 flex items-center justify-center">
              <span className="text-white/20 font-bold uppercase text-xs">BOŞ SLOT</span>
            </div>
          ))}
        </div>

        {league.owner_user_id === user?.id && members.length < 8 && (
          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-xs text-accent font-bold uppercase mb-3 flex justify-center items-center gap-2">
              <ShieldAlert className="w-4 h-4" /> Komisyoner Paneli
            </p>
            <p className="text-[10px] text-white/50 mb-4">Ligi hemen başlatmak ve boş slotları botlarla doldurmak için lütfen Admin Panelini kullanın.</p>
            <button 
              onClick={() => navigate('/admin')}
              className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-6 rounded-lg text-sm transition"
            >
              ADMİN PANELİNE GİT
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
