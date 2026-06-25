import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useFranchiseStore } from '@/store/franchiseStore'
import { supabase } from '@/lib/supabase'
import { Users, Clock, ShieldAlert, Copy, Check, Cpu } from 'lucide-react'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

export function LeagueLobbyPage() {
  const { user } = useAuthStore()
  const { activeFranchiseId, franchise, league, setLeague } = useFranchiseStore()
  const navigate = useNavigate()

  const [members, setMembers] = useState<unknown[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const handleCopyInvite = () => {
    const text = `🏈 Amerikan Futbolu Ligime davetlisin!\n\n🏆 Lig Adı: ${league?.name}\n${!league?.is_public ? `🔒 Şifre: ${league?.password || 'Komisyonere sorunuz'}\n` : ''}\nHemen takımını kur: https://nfl-manager-alpha.vercel.app/slots?join_league=${league?.id}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    if (!league || !franchise) return
    
    if (league.status === 'draft') {
      navigate('/team-creation')
      return
    }

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
          setLeague(payload.new as unknown)
          if (payload.new.status === 'draft') {
            navigate('/team-creation')
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [league?.id])

  // Automatically start team creation when lobby is full (8 members)
  useEffect(() => {
    if (members.length === 8 && league?.status === 'waiting' && !actionLoading) {
      handleStartDraft()
    }
  }, [members.length, league?.status])

  const fetchMembers = async () => {
    if (!league) return
    const { data } = await supabase
      .from('franchises')
      .select('id, user_id, team_name, city, users(username)')
      .eq('league_id', league.id)
    
    if (data) setMembers(data)
    setLoading(false)

    // Also re-fetch league status just in case realtime missed it
    const { data: lg } = await supabase.from('leagues').select('*').eq('id', league.id).single()
    if (lg) {
      setLeague(lg as unknown)
      if (lg.status === 'draft') {
        navigate('/team-creation')
      }
    }
  }

  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  useEffect(() => {
    if (league?.status === 'waiting') {
      const updateTimer = () => {
        if (!league.matchmaking_start_time) return
        
        // 60 minutes from matchmaking_start_time
        const target = new Date(league.matchmaking_start_time).getTime() + (60 * 60 * 1000)
        const now = Date.now()
        const diff = target - now
        
        if (diff <= 0) {
          setTimeLeft(0)
          // If time is up, unknown user in the lobby can trigger the bot fill (the edge function allows this now)
          // We can auto trigger it, but let's be careful not to spam the function if 8 people hit it at once.
          // Let's just rely on the 'handleFillBots' button showing up for everyone when time is 0.
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
  }, [league?.status, league?.matchmaking_start_time])

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
      
      // Botlar doldu, artık üyeleri ve ligi çek
      await fetchMembers()
      
      // Bazen edge function uzun sürerse ekstra bir check daha yapalım 3 saniye sonra
      setTimeout(() => {
        fetchMembers()
      }, 3000)
    } catch (err: unknown) {
      alert('Hata: ' + (err instanceof Error ? err.message : String(err)))
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
      setLeague({ ...league, draft_start_time: data.draft_start_time })
    } catch (err: unknown) {
      alert('Hata: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setActionLoading(false)
    }
  }

  const handleStartDraft = async () => {
    if (!league) return
    setActionLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('league-start-team-creation', {
        body: { league_id: league.id }
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      setLeague({ ...league, status: 'draft' })
      navigate('/team-creation')
    } catch (err: unknown) {
      alert('Hata: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setActionLoading(false)
    }
  }

  if (!league || !franchise) return null

  if (members.length === 8 && league.status === 'waiting') {
    return <LoadingScreen title="Takım Kurma Aşaması Başlıyor..." />
  }

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

        {/* Bot Fill Action Area */}
        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <div className="flex flex-col gap-4 max-w-md mx-auto">
            {members.length < 8 && user?.email === 'soltackle0@gmail.com' && (
              <button 
                onClick={handleFillBots}
                disabled={actionLoading}
                className="font-bold py-3 px-6 rounded-lg text-sm transition flex items-center justify-center gap-2 bg-[#004b93] hover:bg-[#005c99] text-white cursor-pointer"
              >
                <Cpu className="w-4 h-4" /> 
                TEST BOTLARLA DOLDUR (Sadece soltackle)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
