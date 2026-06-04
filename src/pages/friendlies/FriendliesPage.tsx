import { useEffect, useState } from 'react'
import { useFranchiseStore } from '@/store/franchiseStore'
import { supabase } from '@/lib/supabase'
import { Shield, Coins, AlertCircle, CheckCircle, Activity, Star, Users, ArrowRight } from 'lucide-react'

export function FriendliesPage() {
  const { franchise, league } = useFranchiseStore()
  const [opponents, setOpponents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [simulatingId, setSimulatingId] = useState<string | null>(null)
  const [balance, setBalance] = useState(0)

  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [matchResult, setMatchResult] = useState<any>(null)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!franchise || !league) return
    const fetchData = async () => {
      // 1. Fetch other franchises
      const { data: fr } = await supabase
        .from('franchises')
        .select('id, team_name')
        .eq('league_id', league.id)
        .neq('id', franchise.id)
      if (fr) setOpponents(fr)

      // 2. Fetch user balance
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: u } = await supabase.from('users').select('amfutcoin').eq('id', user.id).single()
        if (u) setBalance(u.amfutcoin || 0)
      }

      setLoading(false)
    }
    fetchData()
  }, [franchise, league])

  const handleSimulate = async (opponentId: string) => {
    if (balance < 4) {
      alert("Yetersiz bakiye! 4 AmFutCoin gereklidir.")
      return
    }

    setSimulatingId(opponentId)
    setErrorMsg('')
    
    try {
      const { data, error } = await supabase.functions.invoke('simulate-friendly', {
        body: { target_franchise_id: opponentId, league_id: league?.id }
      })

      if (error) throw new Error(error.message)
      if (data?.error) throw new Error(data.error)

      setBalance(prev => prev - 4)
      setMatchResult(data)
      setShowModal(true)
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setSimulatingId(null)
    }
  }

  if (loading) {
    return <div className="text-white text-center mt-10">Yükleniyor...</div>
  }

  return (
    <div className="space-y-6 pt-4 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="bg-[#00152b] border border-[#005c99] rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Activity className="w-32 h-32" />
        </div>
        <div className="flex justify-between items-start relative z-10">
          <div>
            <h1 className="text-3xl font-display font-black text-white uppercase tracking-wider">DOSTLUK MAÇLARI</h1>
            <p className="text-white/60 mt-2 max-w-lg text-sm">
              Rakiplerinize karşı dostluk maçları oynayarak taktiklerinizi test edin ve oyuncularınıza ekstra tecrübe puanı (XP) kazandırın.
            </p>
          </div>
          <div className="bg-[#00254c] border border-accent rounded-xl p-4 flex flex-col items-center min-w-[120px] shadow-[0_0_15px_rgba(255,156,0,0.2)]">
            <Coins className="w-8 h-8 text-accent mb-1" />
            <span className="text-2xl font-black text-white">{balance}</span>
            <span className="text-[10px] text-accent font-bold uppercase tracking-widest">AMFUTCOIN</span>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-500/20 border border-red-500 rounded p-4 flex items-center gap-2 text-red-200">
          <AlertCircle className="w-5 h-5" />
          <span className="font-bold text-sm">{errorMsg}</span>
        </div>
      )}

      {/* Opponents List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {opponents.map(opp => (
          <div key={opp.id} className="bg-[#00152b] border border-white/10 rounded-xl p-4 flex items-center justify-between hover:border-white/30 transition-colors">
            <div className="flex items-center gap-4">
              <div className="bg-[#00254c] p-3 rounded-full border border-white/5 shadow-inner">
                <Shield className="w-8 h-8 text-white/40" fill="currentColor" />
              </div>
              <div>
                <div className="font-display font-bold text-white text-lg uppercase">{opp.team_name}</div>
                <div className="text-xs font-bold text-white/40 flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-500" />
                  GELİŞİM İÇİN İDEAL RAKİP
                </div>
              </div>
            </div>

            <button
              onClick={() => handleSimulate(opp.id)}
              disabled={simulatingId !== null || balance < 4}
              className={`flex flex-col items-center justify-center px-6 py-2 rounded-lg font-bold transition-all ${
                simulatingId === opp.id
                  ? 'bg-white/10 text-white cursor-wait'
                  : balance < 4
                  ? 'bg-red-500/20 text-red-400 cursor-not-allowed border border-red-500/50'
                  : 'bg-accent text-[#001021] hover:bg-white hover:shadow-[0_0_15px_rgba(255,156,0,0.5)]'
              }`}
            >
              {simulatingId === opp.id ? (
                <span className="text-sm">Oynanıyor...</span>
              ) : (
                <>
                  <span className="text-sm uppercase tracking-wider">Maç Yap</span>
                  <span className="text-[10px] flex items-center gap-1 opacity-80">
                    <Coins className="w-3 h-3" /> 4 Coin
                  </span>
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Match Result Modal */}
      {showModal && matchResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gradient-to-b from-[#001f40] to-[#001021] border-2 border-accent rounded-2xl p-6 w-full max-w-lg shadow-[0_0_50px_rgba(255,156,0,0.2)] animate-in fade-in zoom-in duration-300">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center bg-accent/20 text-accent rounded-full p-3 mb-2">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-display font-black text-white uppercase tracking-widest">Maç Sonucu</h2>
              <p className="text-white/50 text-sm mt-1">Dostluk maçı tamamlandı, oyuncuların tecrübe kazandı.</p>
            </div>

            <div className="flex items-center justify-center gap-6 mb-8 bg-black/20 rounded-xl p-6 border border-white/5">
              <div className="text-center flex-1">
                <Shield className="w-12 h-12 text-accent mx-auto mb-2" fill="currentColor" />
                <div className="text-sm font-bold text-white uppercase">{franchise?.team_name}</div>
              </div>
              <div className="flex items-center gap-4 text-4xl font-display font-black text-white">
                <span>{matchResult.stats.homeScore}</span>
                <span className="text-white/20 text-xl">-</span>
                <span>{matchResult.stats.awayScore}</span>
              </div>
              <div className="text-center flex-1">
                <Shield className="w-12 h-12 text-white/20 mx-auto mb-2" fill="currentColor" />
                <div className="text-sm font-bold text-white/60 uppercase">{matchResult.stats.awayTeamName}</div>
              </div>
            </div>

            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-green-400">
                  <Activity className="w-5 h-5" />
                  <span className="font-bold text-sm uppercase">Gelişim Raporu</span>
                </div>
                <span className="text-xs text-green-400/60">+XP Eklendi</span>
              </div>
              <div className="text-sm text-green-100/80">
                Takımındaki tüm oyuncular bu maçtan tecrübe kazandı ve özelliklerinde ufak artışlar oldu!
              </div>
            </div>

            <button 
              onClick={() => setShowModal(false)}
              className="w-full bg-white text-[#001021] py-4 rounded-xl font-display font-black text-lg uppercase tracking-widest hover:bg-gray-200 transition-colors"
            >
              Kapat
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
