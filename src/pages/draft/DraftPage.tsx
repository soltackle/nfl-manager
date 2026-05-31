import { useState, useEffect } from 'react'
import { useDraft } from '@/hooks/useDraft'
import { useFranchiseStore } from '@/store/franchiseStore'
import { Trophy, Clock, UserCheck, ShieldAlert, Cpu } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'

export function DraftPage() {
  const { draftSession, availablePlayers, picks, makePick, isLoading } = useDraft()
  const { franchise } = useFranchiseStore()
  const [filter, setFilter] = useState('TÜMÜ')
  const [isPicking, setIsPicking] = useState(false)
  const [timeLeft, setTimeLeft] = useState(10)

  // Timer logic
  useEffect(() => {
    if (!draftSession || draftSession.current_pick_franchise_id !== franchise?.id) {
      setTimeLeft(10)
      return
    }
    
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Auto-pick logic could trigger here on client side or rely on backend
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(interval)
  }, [draftSession, franchise?.id])

  if (isLoading) {
    return (
      <div className="space-y-4 pt-4">
        <Skeleton className="h-24 w-full bg-[#00152b] rounded-xl" />
        <Skeleton className="h-96 w-full bg-[#00152b] rounded-xl" />
      </div>
    )
  }

  if (!draftSession) {
    return (
      <div className="pt-24 text-center">
        <ShieldAlert className="w-16 h-16 text-yellow-500 mx-auto mb-4 opacity-50" />
        <h2 className="text-2xl font-display font-black text-white uppercase tracking-widest">DRAFT BAŞLAMADI</h2>
        <p className="text-white/50 mt-2">Bu lig için henüz draft odası oluşturulmamış veya draft tamamlanmış.</p>
      </div>
    )
  }

  const isMyTurn = draftSession.current_pick_franchise_id === franchise?.id
  const filteredPlayers = availablePlayers.filter(p => filter === 'TÜMÜ' || p.position === filter)

  const handlePick = async (playerId: string) => {
    if (!isMyTurn || isPicking) return
    setIsPicking(true)
    try {
      await makePick(playerId)
    } catch (err: any) {
      alert('Seçim hatası: ' + err.message)
    } finally {
      setIsPicking(false)
    }
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
              TUR {draftSession.current_round} / 8
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
          <button className="bg-yellow-500 text-black px-4 py-2 rounded font-bold text-xs uppercase hover:bg-yellow-400 flex flex-col items-center leading-none">
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
                    <div className="text-xs text-white/50 uppercase font-bold mt-1">
                      ${((p.value || 0) / 1000).toFixed(0)}K DEĞERİNDE
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
        <div className="bg-[#00152b] border border-[#005c99] rounded-xl p-6 flex flex-col h-[600px]">
          <h2 className="text-xl font-display font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-accent" /> Son Seçimler
          </h2>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
            {picks.length === 0 ? (
              <div className="text-center text-white/30 font-bold uppercase py-10">
                Henüz seçim yapılmadı
              </div>
            ) : (
              picks.map((pick, i) => (
                <div key={pick.id} className="bg-[#001021] border border-white/5 p-3 rounded-lg relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent"></div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold uppercase text-white/50 bg-white/5 px-2 py-0.5 rounded">Pick {picks.length - i}</span>
                    <span className="text-xs font-bold text-accent">{pick.franchises?.team_name}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="font-bold text-white">{pick.players?.name}</div>
                      <div className="text-xs text-white/50">{pick.players?.position}</div>
                    </div>
                    <div className="font-display font-bold text-lg text-white/80">{pick.players?.overall}</div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <button className="mt-4 w-full py-3 bg-[#00254c] text-white/50 font-bold uppercase text-xs rounded hover:bg-[#003366] hover:text-white transition-colors border border-dashed border-white/20 flex items-center justify-center gap-2">
            <Cpu className="w-4 h-4" /> Bot Olarak Seç (AFK)
          </button>
        </div>

      </div>
    </div>
  )
}
