import { useState, useEffect } from 'react'
import { useTraining } from '@/hooks/useTraining'
import { Shield, Zap, Activity, Clock, Plus, X } from 'lucide-react'
import { useToastStore } from '@/store/toastStore'
import { useUiStore } from '@/store/uiStore'

const TimeLeft = ({ endTime }: { endTime: string }) => {
  const [timeLeft, setTimeLeft] = useState('')
  
  useEffect(() => {
    const interval = setInterval(() => {
      const diff = new Date(endTime).getTime() - Date.now()
      if (diff <= 0) {
        setTimeLeft('Tamamlandı')
        clearInterval(interval)
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        setTimeLeft(`${hours}s ${mins}d`)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [endTime])

  return <span className="font-bold font-display">{timeLeft}</span>
}

export function TrainingPage() {
  const { roster, sessions, startTraining } = useTraining()
  
  const [selectedSlot, setSelectedSlot] = useState<'OC' | 'DC' | 'ST' | 'HC'>('OC')
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const [isStarting, setIsStarting] = useState(false)

  // Get active session for the current slot
  // We identify slot by the positions of the players in the session
  const getSlotSession = (slot: string) => {
    if (sessions.length === 0) return null
    
    // Group sessions by completion time
    const groups = sessions.reduce((acc: Record<string, unknown[]>, s: unknown) => {
      if (!acc[s.completed_at]) acc[s.completed_at] = []
      acc[s.completed_at].push(s)
      return acc
    }, {})

    // Find the group that matches this slot's position criteria
    for (const [time, sessGrp] of Object.entries(groups)) {
      const playersInSession = roster.filter(p => (sessGrp as unknown).some((s:unknown) => s.player_id === p.id))
      if (playersInSession.length === 0) continue
      
      const pos = playersInSession[0].position
      let sessionSlot = 'HC'
      if (['QB', 'RB', 'WR', 'TE', 'OL'].includes(pos)) sessionSlot = 'OC'
      else if (['DL', 'DE', 'LB', 'CB', 'S'].includes(pos)) sessionSlot = 'DC'
      else if (['K', 'P'].includes(pos)) sessionSlot = 'ST'

      if (sessionSlot === slot) {
        return { completedAt: time, players: playersInSession }
      }
    }
    return null
  }

  const currentSession = getSlotSession(selectedSlot)

  // Determine allowed positions and limits for the selected slot
  let allowedPos: string[] = []
  let maxPlayers = 3
  let slotName = ''
  
  if (selectedSlot === 'OC') {
    allowedPos = ['QB', 'RB', 'WR', 'TE', 'OL']
    slotName = 'Hücum Koordinatörü (OC)'
    maxPlayers = 3
  } else if (selectedSlot === 'DC') {
    allowedPos = ['DL', 'DE', 'LB', 'CB', 'S']
    slotName = 'Savunma Koordinatörü (DC)'
    maxPlayers = 3
  } else if (selectedSlot === 'ST') {
    allowedPos = ['K', 'P']
    slotName = 'Özel Takım Koçu (ST)'
    maxPlayers = 2
  } else if (selectedSlot === 'HC') {
    allowedPos = []
    slotName = 'Head Coach'
    maxPlayers = 0
  }

  // Filter roster
  const availableRoster = roster.filter(p => allowedPos.includes(p.position))
  // Filter out players already in ANY training session
  const trainingPlayerIds = sessions.map(s => s.player_id)
  const selectablePlayers = availableRoster.filter(p => !trainingPlayerIds.includes(p.id))

  const handleSelectPlayer = (id: string) => {
    if (selectedPlayers.includes(id)) {
      setSelectedPlayers(selectedPlayers.filter(pid => pid !== id))
    } else {
      if (selectedPlayers.length < maxPlayers) {
        setSelectedPlayers([...selectedPlayers, id])
      }
    }
  }

  const handleStartTraining = async () => {
    if (selectedPlayers.length === 0) return
    setIsStarting(true)
    useUiStore.getState().setLoading(true, 'Antrenman Başlatılıyor...')
    try {
      await startTraining(selectedPlayers, selectedSlot)
      setSelectedPlayers([])
      useToastStore.getState().addToast('Antrenman başarıyla başladı! 4 saat sonra tamamlanacak.', 'success')
    } catch (err: unknown) {
      useToastStore.getState().addToast('Hata: ' + (err instanceof Error ? err.message : String(err)), 'error')
    } finally {
      setIsStarting(false)
      useUiStore.getState().setLoading(false)
    }
  }



  return (
    <div className="space-y-6 pt-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#003366] to-[#00152b] rounded-xl p-6 border border-[#005c99] flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-4">
          <div className="bg-accent rounded-xl p-3 shadow-[0_0_15px_rgba(255,156,0,0.4)]">
            <Activity className="w-8 h-8 text-[#001021]" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-black text-white uppercase tracking-wider">ANTRENMAN MERKEZİ</h1>
            <p className="text-accent text-sm font-bold uppercase">Oyuncularını Geliştir</p>
          </div>
        </div>
      </div>

      {/* Slots Tabs */}
      <div className="flex gap-2">
        {(['HC', 'OC', 'DC', 'ST'] as const).map(slot => (
          <button
            key={slot}
            onClick={() => {
              if (selectedSlot !== slot) {
                setSelectedSlot(slot)
                setSelectedPlayers([])
              }
            }}
            className={`flex-1 py-3 rounded-t-xl font-display font-bold uppercase tracking-wider transition-colors border-b-4 ${
              selectedSlot === slot 
                ? 'bg-[#00254c] text-accent border-accent' 
                : 'bg-[#00152b] text-white/50 border-transparent hover:bg-[#002040] hover:text-white'
            }`}
          >
            {slot}
          </button>
        ))}
      </div>

      <div className="bg-[#00254c] p-6 rounded-b-xl rounded-tr-xl border border-[#005c99] -mt-2">
        {selectedSlot === 'HC' ? (
          <div className="text-center py-10">
            <Shield className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h2 className="text-xl font-display font-bold text-white mb-2">HEAD COACH EFEKTİ</h2>
            <p className="text-white/60 text-sm max-w-md mx-auto">
              Head Coach tüm takıma otomatik olarak liderlik eder. Ekstra bir oyuncu seçmenize gerek yoktur. Maç günleri takımın genel formu artar.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
              <h2 className="text-lg font-display font-bold text-white uppercase">{slotName}</h2>
              {currentSession ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-[#001021] px-4 py-2 rounded-lg border border-accent/30">
                    <Clock className="w-4 h-4 text-accent" />
                    <span className="text-sm text-white/60">Kalan Süre:</span>
                    <span className="text-accent"><TimeLeft endTime={currentSession.completedAt} /></span>
                  </div>
                  <button className="bg-yellow-500 text-black px-4 py-2 rounded font-bold text-sm uppercase flex items-center gap-2 hover:bg-yellow-400">
                    <Zap className="w-4 h-4" /> 25🪙 Hızlandır
                  </button>
                </div>
              ) : (
                <div className="text-green-400 font-bold uppercase text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Koç Müsait
                </div>
              )}
            </div>

            {currentSession ? (
              <div className="space-y-4">
                <p className="text-white/50 text-sm font-bold uppercase mb-4">Şu An Antrenmanda Olanlar:</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {currentSession.players.map((p: unknown) => (
                    <div key={p.id} className="bg-gradient-to-r from-[#00152b] to-[#001021] border border-accent/50 p-4 rounded-xl flex items-center gap-4">
                      <div className="bg-[#00254c] rounded w-12 h-12 flex items-center justify-center font-display font-black text-xl text-white">
                        {p.position}
                      </div>
                      <div>
                        <div className="font-bold text-white">{p.name}</div>
                        <div className="text-accent text-xs font-bold uppercase mt-1">{p.overall} OVR</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <p className="text-white/50 text-sm font-bold uppercase mb-4">
                  Seçilen Oyuncular ({selectedPlayers.length}/{maxPlayers})
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  {Array.from({ length: maxPlayers }).map((_, i) => {
                    const pid = selectedPlayers[i]
                    const player = selectablePlayers.find(p => p.id === pid)
                    
                    return player ? (
                      <div key={i} className="bg-[#00152b] border border-[#00a2ff] p-4 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-[#00254c] rounded w-10 h-10 flex items-center justify-center font-display font-black text-white">
                            {player.position}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm">{player.name}</div>
                            <div className="text-[#00a2ff] text-xs font-bold uppercase">{player.overall} OVR</div>
                          </div>
                        </div>
                        <button onClick={() => handleSelectPlayer(player.id)} className="text-red-400 hover:text-red-300">
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <div key={i} className="border-2 border-dashed border-white/10 p-4 rounded-xl flex flex-col items-center justify-center text-white/30 h-[88px]">
                        <Plus className="w-6 h-6 mb-1" />
                        <span className="text-[10px] uppercase font-bold">Slot Boş</span>
                      </div>
                    )
                  })}
                </div>

                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Müsait Oyuncular</h3>
                  <button 
                    onClick={handleStartTraining}
                    disabled={selectedPlayers.length === 0 || isStarting}
                    className="bg-accent text-[#001021] px-8 py-3 rounded-lg font-display font-black uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50"
                  >
                    {isStarting ? 'BAŞLIYOR...' : 'ANTRENMANI BAŞLAT'}
                  </button>
                </div>

                <div className="bg-[#001021] border border-[#005c99] rounded-xl overflow-hidden max-h-96 overflow-y-auto custom-scrollbar">
                  {selectablePlayers.map(p => {
                    const isSelected = selectedPlayers.includes(p.id)
                    return (
                      <div 
                        key={p.id} 
                        onClick={() => handleSelectPlayer(p.id)}
                        className={`flex items-center justify-between p-3 border-b border-white/5 cursor-pointer transition-colors ${isSelected ? 'bg-[#003366]' : 'hover:bg-white/5'}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 text-center font-display font-black text-white/80">{p.position}</div>
                          <div>
                            <div className="font-bold text-white">{p.name}</div>
                            <div className="text-xs text-white/50">{p.age} Yaş</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="font-display font-black text-lg text-accent">{p.overall}</div>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-accent border-accent text-[#001021]' : 'border-white/30'}`}>
                            {isSelected && <div className="w-2.5 h-2.5 bg-[#001021] rounded-full" />}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {selectablePlayers.length === 0 && (
                    <div className="p-8 text-center text-white/50">Bu koç için uygun oyuncu bulunamadı.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
