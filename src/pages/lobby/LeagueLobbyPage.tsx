import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useFranchiseStore } from '@/store/franchiseStore'
import { supabase } from '@/lib/supabase'
import { Users, Clock, ShieldAlert, Copy, Check, Cpu } from 'lucide-react'

export function LeagueLobbyPage() {
  const { user } = useAuthStore()
  const { activeFranchiseId, franchise, league, setLeague } = useFranchiseStore()
  const navigate = useNavigate()

  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const handleCopyInvite = () => {
    const text = `🏈 Amerikan Futbolu Ligime davetlisin!\n\n🏆 Lig Adı: ${league?.name}\n${!league?.is_public ? `🔒 Şifre: ${league?.password || 'Komisyonere sorunuz'}\n` : ''}\nHemen takımını kur: https://nfl-manager-alpha.vercel.app/`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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
    if (members.length === 8 && league?.draft_start_time) {
      const updateTimer = () => {
        const target = new Date(league.draft_start_time).getTime()
        const diff = target - Date.now()
        if (diff <= 0) {
          setTimeLeft(0)
        } else {
          setTimeLeft(diff)
        }
      }
      updateTimer()
      const interval = setInterval(updateTimer, 1000)
      return () => clearInterval(interval)
    } else {
      setTimeLeft(null)
    }
  }, [members.length, league?.draft_start_time])

  const handleFillBots = async () => {
    if (!league) return
    if (!window.confirm('Eksik slotlar botlarla doldurulacak. Emin misiniz?')) return
    setActionLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('league-fill-bots', {
        body: { league_id: league.id }
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      // fetchMembers will be triggered by realtime
    } catch (err: any) {
      alert('Hata: ' + err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleSetTime = async (minutes: number) => {
    if (!league) return
    setActionLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('league-set-draft-time', {
        body: { league_id: league.id, minutes }
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
    } catch (err: any) {
      alert('Hata: ' + err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleStartDraft = async () => {
    if (!league) return
    setActionLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('league-start-draft', {
        body: { league_id: league.id }
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      // Realtime listener will redirect to /draft
    } catch (err: any) {
      alert('Hata: ' + err.message)
    } finally {
      setActionLoading(false)
    }
  }

  if (!league || !franchise) return null

  const isDraftCountdown = members.length === 8 && league?.draft_start_time != null

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
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <p className="text-accent text-sm font-bold uppercase flex items-center justify-center gap-2">
              <Users className="w-4 h-4" /> 
              {members.length} / 8 OYUNCU
            </p>
            <button 
              onClick={handleCopyInvite}
              className="flex items-center gap-2 bg-[#004b93]/20 hover:bg-[#004b93]/40 border border-[#005c99] text-white px-4 py-2 rounded-full text-xs font-bold transition-all uppercase tracking-wider"
            >
              {copied ? <><Check className="w-4 h-4 text-green-400" /> KOPYALANDI</> : <><Copy className="w-4 h-4" /> ARKADAŞINI DAVET ET</>}
            </button>
          </div>
        </div>

        {isDraftCountdown ? (
          <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-6 mb-8 text-center">
            <h2 className="text-xl font-display font-black text-red-500 uppercase tracking-widest mb-2 flex justify-center items-center gap-2">
              <Clock className="w-6 h-6 animate-pulse" /> DRAFT BAŞLIYOR
            </h2>
            <p className="text-white/70 text-sm font-bold uppercase mb-4">Lütfen sayfadan ayrılmayın, süre dolduğunda komisyoner draftı başlatacak.</p>
            <div className="text-5xl font-mono font-black text-white">{formatTime(timeLeft)}</div>
          </div>
        ) : (
          <div className="bg-[#001021] border border-white/5 rounded-xl p-6 mb-8 text-center">
            <h2 className="text-lg font-display font-bold text-white/50 uppercase tracking-widest mb-2 flex justify-center items-center gap-2">
              <Clock className="w-5 h-5" /> BEKLENİYOR...
            </h2>
            <p className="text-white/40 text-xs font-bold uppercase">
              {members.length < 8 ? 'Ligin dolması bekleniyor.' : 'Komisyonerin süreyi başlatması bekleniyor.'}
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

        {league.owner_user_id === user?.id && (
          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-xs text-accent font-bold uppercase mb-4 flex justify-center items-center gap-2">
              <ShieldAlert className="w-4 h-4" /> Komisyoner Paneli
            </p>
            
            <div className="flex flex-col gap-4 max-w-md mx-auto">
              {members.length < 8 && (
                <button 
                  onClick={handleFillBots}
                  disabled={actionLoading}
                  className="bg-[#004b93] hover:bg-[#005c99] text-white font-bold py-3 px-6 rounded-lg text-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Cpu className="w-4 h-4" /> EKSİK SLOTLARI BOTLARLA DOLDUR
                </button>
              )}
              
              {members.length === 8 && !league.draft_start_time && (
                <div className="bg-[#001021] border border-[#005c99] rounded-lg p-4">
                  <p className="text-xs text-white/70 mb-3">Draft süresini ayarlayın ve başlatın:</p>
                  <div className="flex gap-2 justify-center">
                    <button onClick={() => handleSetTime(1)} disabled={actionLoading} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded text-sm font-bold transition">1 DK</button>
                    <button onClick={() => handleSetTime(5)} disabled={actionLoading} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded text-sm font-bold transition">5 DK</button>
                    <button onClick={() => handleSetTime(10)} disabled={actionLoading} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded text-sm font-bold transition">10 DK</button>
                  </div>
                </div>
              )}

              {members.length === 8 && league.draft_start_time && timeLeft === 0 && (
                <button 
                  onClick={handleStartDraft}
                  disabled={actionLoading}
                  className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-lg text-xl tracking-widest transition animate-pulse"
                >
                  DRAFTI BAŞLAT
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
