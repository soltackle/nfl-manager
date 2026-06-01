import { useState, useEffect } from 'react'
import { useDraft } from '@/hooks/useDraft'
import { useFranchiseStore } from '@/store/franchiseStore'
import { Trophy, Clock, UserCheck, ShieldAlert, Cpu } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'
import { TraitBadge } from '@/components/ui/TraitBadge'

export function DraftPage() {
  const { draftSession, availablePlayers, picks, makePick, isLoading } = useDraft()
  const { franchise } = useFranchiseStore()
  const [filter, setFilter] = useState('TÜMÜ')
  const [isPicking, setIsPicking] = useState(false)
  const [timeLeft, setTimeLeft] = useState(10)
  const [rightTab, setRightTab] = useState<'HISTORY' | 'MY_TEAM'>('HISTORY')

  const isMyTurn = draftSession?.current_pick_franchise_id === franchise?.id
  const filteredPlayers = availablePlayers.filter(p => filter === 'TÜMÜ' || p.position === filter)
  const myPicks = picks.filter(p => p.franchise_id === franchise?.id)

  const handlePick = async (playerId: string | null) => {
    if (!isMyTurn || isPicking) return
    setIsPicking(true)
    try {
      await makePick(playerId)
    } catch (err: any) {
      if (playerId) alert('Seçim hatası: ' + err.message)
      else console.error('Auto-pick hatası: ' + err.message)
    } finally {
      setIsPicking(false)
    }
  }

  const handleAddTime = async () => {
    if (!isMyTurn) return
    if (franchise.club_fund < 15) {
      return alert('Yeterli AmFutCoin yok!')
    }
    
    // Optimistic UI update
    setTimeLeft(prev => prev + 10)
    
    try {
      // In a real app we'd call an Edge Function or RPC to deduct funds and sync time.
      // For this implementation, we deduct locally via RPC for simplicity.
      await supabase.rpc('deduct_club_fund', { p_franchise_id: franchise.id, p_amount: 15 })
    } catch (e) {
      console.error("Time add error", e)
    }
  }

  // Timer logic
  useEffect(() => {
    if (!draftSession || draftSession.current_pick_franchise_id !== franchise?.id) {
      setTimeLeft(10)
      return
    }
    
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Auto-pick when time expires
          if (!isPicking) {
            handlePick(null)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(interval)
  }, [draftSession?.current_pick_franchise_id, franchise?.id, isPicking])

  if (isLoading) {
    return (
      <div className="space-y-4 pt-4">
        <Skeleton className="h-24 w-full bg-[#00152b] rounded-xl" />
        <Skeleton className="h-96 w-full bg-[#00152b] rounded-xl" />
      </div>
    )
  }

  // If draft is over (session deleted) but we have a franchise
  if (!draftSession && franchise) {
    // If we have picks or league status is active, redirect to coach selection
    if (picks.length > 0) {
      setTimeout(() => {
        window.location.href = '/coach-selection'
      }, 3000)
      
      return (
        <div className="pt-24 text-center">
          <Trophy className="w-16 h-16 text-accent mx-auto mb-4 animate-bounce" />
          <h2 className="text-2xl font-display font-black text-white uppercase tracking-widest">DRAFT TAMAMLANDI!</h2>
          <p className="text-white/50 mt-2">Kadrolar oluşturuldu, Fikstür ayarlandı. Ana merkeze yönlendiriliyorsunuz...</p>
        </div>
      )
    }

    return (
      <div className="pt-24 text-center">
        <ShieldAlert className="w-16 h-16 text-yellow-500 mx-auto mb-4 opacity-50" />
        <h2 className="text-2xl font-display font-black text-white uppercase tracking-widest">DRAFT BAŞLAMADI</h2>
        <p className="text-white/50 mt-2">Bu lig için henüz draft odası oluşturulmamış veya draft tamamlanmış.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pt-4">
      {/* Header / Status Bar */}
      <div className={`rounded-xl p-6 border flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl transition-colors ${
        isMyTurn ? 'bg-gradient-to-r from-[#003300] to-[#001a00] border-green-500' : 'bg-gradient-to-r from-[#003366] to-[#00152b] border-[#005c99]'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-xl ${isMyTurn ? 'bg-green-500 text-black' : 'bg-[#001021] text-accent'}`}>
            <Trophy className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-black text-white uppercase tracking-wider">
              TUR {draftSession?.current_round || 1} / 8
            </h1>
            <p className={`font-bold uppercase ${isMyTurn ? 'text-green-400' : 'text-accent'}`}>
              {isMyTurn ? 'SIRA SİZDE!' : 'Rakip Seçim Yapıyor...'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-xs font-bold uppercase text-white/50 mb-1">Kalan Süre</p>
            <div className={`font-display font-black text-3xl ${timeLeft <= 3 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
              00:{timeLeft.toString().padStart(2, '0')}
            </div>
          </div>
          <button 
            onClick={handleAddTime}
            disabled={!isMyTurn}
            className={`bg-yellow-500 text-black px-4 py-2 rounded font-bold text-xs uppercase hover:bg-yellow-400 flex flex-col items-center leading-none ${!isMyTurn && 'opacity-50 cursor-not-allowed'}`}
          >
            <span>+10 Saniye</span>
            <span className="text-[9px] opacity-70">15🪙</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Player Pool */}
        <div className="lg:col-span-2 space-y-4">
          
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {['TÜMÜ', 'QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'CB', 'S', 'K', 'P'].map(pos => (
              <button
                key={pos}
                onClick={() => setFilter(pos)}
                className={`px-4 py-2 rounded text-sm font-bold uppercase whitespace-nowrap transition-colors ${
                  filter === pos ? 'bg-accent text-[#001021]' : 'bg-[#00152b] text-white/50 hover:bg-[#00254c] hover:text-white border border-[#005c99]'
                }`}
              >
                {pos}
              </button>
            ))}
          </div>

          <div className="bg-[#001021] border border-[#005c99] rounded-xl overflow-hidden max-h-[600px] overflow-y-auto custom-scrollbar">
            {filteredPlayers.map(p => (
              <div key={p.id} className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-12 text-center font-display font-black text-2xl text-white/20 group-hover:text-white/40 transition-colors">
                    {p.position}
                  </div>
                  <div>
                    <div className="font-bold text-white text-lg flex items-center gap-2">
                      {p.name}
                      {p.overall >= 85 && <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded border border-yellow-500/30">STAR</span>}
                      {p.overall >= 75 && p.overall < 85 && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30">SOLID</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="text-xs text-white/50 uppercase font-bold">
                        ${((p.value || 0) / 1000).toFixed(0)}K
                      </div>
                      {p.traits && p.traits.map((trait: string, idx: number) => (
                        <TraitBadge key={idx} trait={trait} />
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="font-display font-black text-3xl text-accent">{p.overall}</div>
                  <button 
                    onClick={() => handlePick(p.id)}
                    disabled={!isMyTurn || isPicking}
                    className={`px-6 py-3 rounded font-display font-bold uppercase tracking-wider transition-colors ${
                      isMyTurn 
                        ? 'bg-accent text-[#001021] hover:bg-white' 
                        : 'bg-white/5 text-white/20 cursor-not-allowed'
                    }`}
                  >
                    SEÇ
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Draft History */}
        <div className="bg-[#00152b] border border-[#005c99] rounded-xl p-4 flex flex-col h-[600px]">
          
          {/* Tabs for Right Column */}
          <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-2">
            <button 
              onClick={() => setRightTab('HISTORY')}
              className={`flex-1 py-2 text-xs font-bold uppercase rounded transition-colors ${rightTab === 'HISTORY' ? 'bg-accent text-[#001021]' : 'text-white/50 hover:bg-white/5'}`}
            >
              Canlı Akış
            </button>
            <button 
              onClick={() => setRightTab('MY_TEAM')}
              className={`flex-1 py-2 text-xs font-bold uppercase rounded transition-colors ${rightTab === 'MY_TEAM' ? 'bg-green-500 text-black' : 'text-white/50 hover:bg-white/5'}`}
            >
              Benim Kadrom ({myPicks.length})
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
            {rightTab === 'HISTORY' && (
              picks.length === 0 ? (
                <div className="text-center text-white/30 font-bold uppercase py-10 flex flex-col items-center">
                  <UserCheck className="w-10 h-10 mb-2 opacity-20" />
                  Henüz seçim yapılmadı
                </div>
              ) : (
                picks.map((pick, i) => {
                  const isMine = pick.franchise_id === franchise?.id;
                  return (
                    <div key={pick.id} className={`p-3 rounded-lg relative overflow-hidden border transition-all ${isMine ? 'bg-green-500/10 border-green-500/30' : 'bg-[#001021] border-white/5'}`}>
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${isMine ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]' : 'bg-accent'}`}></div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold uppercase text-white/50 bg-white/5 px-2 py-0.5 rounded">Pick {picks.length - i}</span>
                        <span className={`text-xs font-bold ${isMine ? 'text-green-400' : 'text-accent'}`}>{pick.franchises?.team_name} {isMine && '(SEN)'}</span>
                      </div>
                      <div className="flex justify-between items-end">
                        <div>
                          <div className={`font-bold ${isMine ? 'text-green-50' : 'text-white'}`}>{pick.players?.name}</div>
                          <div className="text-xs text-white/50">{pick.players?.position}</div>
                        </div>
                        <div className={`font-display font-bold text-lg ${isMine ? 'text-green-400' : 'text-white/80'}`}>{pick.players?.overall}</div>
                      </div>
                    </div>
                  )
                })
              )
            )}

            {rightTab === 'MY_TEAM' && (
              myPicks.length === 0 ? (
                <div className="text-center text-white/30 font-bold uppercase py-10 flex flex-col items-center">
                  <Trophy className="w-10 h-10 mb-2 opacity-20" />
                  Henüz oyuncu seçmediniz
                </div>
              ) : (
                myPicks.map((pick) => (
                  <div key={pick.id} className="bg-[#002010] border border-green-500/20 p-3 rounded-lg flex items-center justify-between hover:bg-green-500/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-green-500/20 text-green-400 flex items-center justify-center font-black font-display text-xs border border-green-500/30">
                        {pick.players?.position}
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm">{pick.players?.name}</div>
                        <div className="text-[10px] text-green-400/70 uppercase font-bold mt-0.5">Round {pick.round}</div>
                      </div>
                    </div>
                    <div className="font-display font-black text-xl text-green-400">{pick.players?.overall}</div>
                  </div>
                ))
              )
            )}
          </div>
          
          <button 
            onClick={() => handlePick(null)}
            disabled={!isMyTurn || isPicking}
            className={`mt-4 w-full py-3 text-white/50 font-bold uppercase text-xs rounded border border-dashed border-white/20 flex items-center justify-center gap-2 transition-colors ${
              isMyTurn && !isPicking 
                ? 'bg-[#00254c] hover:bg-[#003366] hover:text-white cursor-pointer' 
                : 'bg-[#001021] opacity-50 cursor-not-allowed'
            }`}
          >
            <Cpu className="w-4 h-4" /> Bot Olarak Seç (AFK)
          </button>
        </div>

      </div>
    </div>
  )
}
