import { useState, useEffect } from 'react'
import { useDepthChart } from '@/hooks/useDepthChart'
import { useRoster } from '@/hooks/useRoster'
import { useFranchiseStore } from '@/store/franchiseStore'
import { supabase } from '@/lib/supabase'
import { Shield, Save, X, GripVertical, AlertTriangle } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'

const OFF_SLOTS = ['QB1', 'QB2', 'RB1', 'RB2', 'WR1', 'WR2', 'WR3', 'WR4', 'TE1', 'TE2', 'OL1', 'OL2']
const DEF_SLOTS = ['DE1', 'DE2', 'LB1', 'LB2', 'LB3', 'CB1', 'CB2', 'S1']
const ST_SLOTS = ['K1', 'P1']
const PS_SLOTS = ['PS1', 'PS2', 'PS3']

const getBasePosition = (slotName: string) => {
  return slotName.replace(/\d+$/, '') // "QB1" -> "QB"
}

export function DepthChartPage() {
  const { depthChart, isLoading: isDcLoading, mutate: mutateDc } = useDepthChart()
  const { roster, isLoading: isRosterLoading } = useRoster()
  const { franchise } = useFranchiseStore()
  
  const [activeTab, setActiveTab] = useState<'OFF' | 'DEF' | 'ST' | 'PS'>('OFF')
  const [isSaving, setIsSaving] = useState(false)
  const [captain, setCaptain] = useState<string | null>(null)
  
  // localDc mapping: "OFF_QB1" -> "player-uuid"
  const [localDc, setLocalDc] = useState<Record<string, string | null>>({})

  // Initialize from DB
  useEffect(() => {
    if (depthChart && depthChart.length > 0) {
      const initial: Record<string, string | null> = {}
      // We stored things with key unit_pos_index in the old version, but now it's unit_slot.
      // Wait, DB has: unit, position.
      // Let's adapt old data to new slots or just reset if incompatible, but let's try mapping:
      const counts: Record<string, number> = {}
      depthChart.forEach(dc => {
        const key = `${dc.unit}_${dc.position}`
        counts[key] = (counts[key] || 0) + 1
        initial[`${dc.unit}_${dc.position}${counts[key]}`] = dc.player_id
      })
      setLocalDc(initial)
    }
  }, [depthChart])

  const handleAutoFill = () => {
    if (!roster) return
    const newDc = { ...localDc }
    const usedIds = new Set(Object.values(newDc).filter(Boolean) as string[])

    const fillSlots = (slots: string[], unit: string) => {
      slots.forEach(slot => {
        const pos = getBasePosition(slot)
        const slotKey = `${unit}_${slot}`
        
        if (!newDc[slotKey]) {
          const available = roster
            .filter(p => (pos === 'PS' ? true : p.position === pos) && !usedIds.has(p.id))
            .sort((a, b) => b.overall - a.overall)
            
          if (available.length > 0) {
            newDc[slotKey] = available[0].id
            usedIds.add(available[0].id)
          }
        }
      })
    }

    fillSlots(OFF_SLOTS, 'OFF')
    fillSlots(DEF_SLOTS, 'DEF')
    fillSlots(ST_SLOTS, 'ST')
    fillSlots(PS_SLOTS, 'PS')

    setLocalDc(newDc)
  }

  const handleSave = async () => {
    if (!franchise) return
    setIsSaving(true)
    try {
      await supabase.from('depth_charts').delete().eq('franchise_id', franchise.id)
      
      const inserts = Object.entries(localDc)
        .filter(([_, playerId]) => playerId)
        .map(([key, playerId]) => {
          const [unit, slotName] = key.split('_')
          const player = roster?.find(r => r.id === playerId)
          return {
            franchise_id: franchise.id,
            player_id: playerId,
            unit: unit,
            position: player?.position as any
          }
        })
      
      if (inserts.length > 0) {
        const { error } = await supabase.from('depth_charts').insert(inserts)
        if (error) throw error
      }
      
      await mutateDc()
      alert('Kadro başarıyla kaydedildi!')
    } catch (err: any) {
      alert('Hata: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const getPlayerDetails = (id: string) => {
    const hash = id.split('-')[0] || '000'
    const num = parseInt(hash, 16) || 0
    const form = 60 + (num % 40) // 60% to 99%
    const isRising = form > 85
    const isInjured = form < 65
    return { form, isRising, isInjured }
  }

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, playerId: string) => {
    e.dataTransfer.setData('playerId', playerId)
  }

  const handleDrop = (e: React.DragEvent, targetSlotKey: string) => {
    e.preventDefault()
    const draggedPlayerId = e.dataTransfer.getData('playerId')
    if (!draggedPlayerId) return

    const newDc = { ...localDc }
    
    // Check if player is already somewhere, clear it
    let existingSlotKey = Object.keys(newDc).find(k => newDc[k] === draggedPlayerId)
    
    // Check if target slot is occupied
    const occupantId = newDc[targetSlotKey]

    // Swap logic
    if (occupantId) {
      if (existingSlotKey) {
        newDc[existingSlotKey] = occupantId // Swap
      } else {
        // Player was from the unassigned list, so occupant goes back to unassigned (gets removed from DC)
      }
    } else {
      if (existingSlotKey) {
        newDc[existingSlotKey] = null
      }
    }

    newDc[targetSlotKey] = draggedPlayerId
    setLocalDc(newDc)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault() // Required to allow drop
  }

  const removePlayerFromSlot = (slotKey: string) => {
    const newDc = { ...localDc }
    newDc[slotKey] = null
    setLocalDc(newDc)
  }

  if (isDcLoading || isRosterLoading || !roster) return (
    <div className="space-y-4 pt-4">
      <Skeleton className="h-12 w-full bg-white/5" />
      <Skeleton className="h-[400px] w-full bg-white/5" />
    </div>
  )

  // Calculate out-of-position penalties
  const getPenalty = (realPos: string, slotPos: string) => {
    if (slotPos === 'PS') return 0 // PS allows any position
    if (realPos === slotPos) return 0
    if ((realPos === 'WR' && slotPos === 'TE') || (realPos === 'TE' && slotPos === 'WR')) return 15
    if (realPos === 'RB' && slotPos === 'WR') return 20
    if ((realPos === 'DE' || realPos === 'DT') && slotPos === 'LB') return 10
    if (realPos === 'LB' && (slotPos === 'DE' || slotPos === 'DT')) return 10
    return 50 // Invalid match
  }

  const activeSlots = 
    activeTab === 'OFF' ? OFF_SLOTS :
    activeTab === 'DEF' ? DEF_SLOTS :
    activeTab === 'ST' ? ST_SLOTS : PS_SLOTS

  // Filter available players for the left list based on the active tab's allowed positions
  const allowedPositionsForTab = 
    activeTab === 'OFF' ? ['QB', 'RB', 'WR', 'TE', 'OL'] :
    activeTab === 'DEF' ? ['DE', 'DT', 'LB', 'CB', 'S'] :
    activeTab === 'ST' ? ['K', 'P'] : [] // PS allows all

  const unassignedPlayers = roster.filter(p => {
    const isAssigned = Object.values(localDc).includes(p.id)
    if (isAssigned) return false
    if (activeTab === 'PS') return true // PS can take anyone
    return allowedPositionsForTab.includes(p.position)
  }).sort((a, b) => b.overall - a.overall)

  return (
    <div className="space-y-4 pt-4 max-w-6xl mx-auto pb-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 bg-[#00152b]/80 p-4 rounded-xl border border-[#005c99]/30 gap-4">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-accent" />
          <div>
            <h1 className="text-xl font-display font-bold text-white tracking-wider">İLK 11 VE KADRO (DEPTH CHART)</h1>
            <p className="text-white/60 text-xs font-bold uppercase">Sürükle bırak ile sahaya çıkacak kadroyu belirleyin</p>
          </div>
        </div>
        <button 
          onClick={handleAutoFill}
          className="px-4 py-2 bg-[#00254c] border border-accent text-accent font-bold text-xs rounded hover:bg-accent hover:text-[#00152b] transition-colors"
        >
          EN İYİLERİ SEÇ (OTO DOLDUR)
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-[#00152b] p-1 rounded-lg border border-white/5 overflow-x-auto hide-scrollbar">
        {[
          { id: 'OFF', label: `HÜCUM (${OFF_SLOTS.length})` },
          { id: 'DEF', label: `SAVUNMA (${DEF_SLOTS.length})` },
          { id: 'ST', label: `ÖZEL (${ST_SLOTS.length})` },
          { id: 'PS', label: `PRACTICE SQUAD (${PS_SLOTS.length})` }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 min-w-[120px] text-[10px] sm:text-xs font-bold uppercase py-2 px-2 sm:px-4 rounded transition-all ${
              activeTab === tab.id 
                ? 'bg-accent text-[#00152b] shadow-[0_0_10px_rgba(255,156,0,0.5)]' 
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
        
        {/* Left Column: Unassigned Players */}
        <div className="lg:col-span-5 bg-[#00152b]/50 rounded-xl border border-white/10 p-4 h-[600px] overflow-y-auto hide-scrollbar">
          <h2 className="text-xs font-bold text-white/50 uppercase mb-4 sticky top-0 bg-[#00152b] py-2">Boştaki Oyuncular (Sürükle)</h2>
          <div className="space-y-2">
            {unassignedPlayers.length === 0 ? (
              <div className="text-center py-8 text-white/30 text-sm font-bold border border-dashed border-white/5 rounded-lg">
                Tüm oyuncular yerleştirildi veya uygun pozisyon yok.
              </div>
            ) : unassignedPlayers.map(player => {
              const { form, isRising, isInjured } = getPlayerDetails(player.id)
              return (
                <div 
                  key={player.id} 
                  draggable 
                  onDragStart={(e) => handleDragStart(e, player.id)}
                  className="flex items-center gap-3 bg-[#001021] p-2 rounded-lg border border-white/5 hover:border-accent/50 cursor-grab active:cursor-grabbing transition-colors group"
                >
                  <GripVertical className="w-4 h-4 text-white/20 group-hover:text-accent" />
                  <div className="w-8 h-8 rounded bg-[#00254c] text-white flex items-center justify-center font-display font-bold text-xs border border-[#005c99]">
                    {player.position}
                  </div>
                  <div className="flex-1">
                    <div className="text-white text-sm font-bold">{player.overall >= 85 ? '⭐' : ''} {player.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-white/50">OVR: {player.overall}</span>
                      <span className="text-[10px] bg-white/10 px-1 rounded text-accent">🔥 {form}</span>
                      {isInjured && <span className="text-[10px] text-red-400">🔒 Kilitli</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Column: Depth Chart Slots */}
        <div className="lg:col-span-7 bg-[#00152b]/50 rounded-xl border border-white/10 p-4 h-[600px] overflow-y-auto hide-scrollbar">
          <h2 className="text-xs font-bold text-white/50 uppercase mb-4 sticky top-0 bg-[#00152b] py-2">İlk 11 ve Yedek Yuvaları (Bırak)</h2>
          <div className="space-y-3">
            {activeSlots.map(slotName => {
              const slotKey = `${activeTab}_${slotName}`
              const playerId = localDc[slotKey]
              const player = roster?.find(r => r.id === playerId)
              const basePos = getBasePosition(slotName)

              let battleIndicator = false
              let penalty = 0
              let details = null

              if (player) {
                details = getPlayerDetails(player.id)
                penalty = getPenalty(player.position, basePos)

                // Positional battle logic (if backup OVR is within 5 of starter)
                // For simplicity, just check if ANY unassigned player in same pos is within 5 OVR
                const bestBackup = unassignedPlayers.find(p => p.position === player.position)
                if (bestBackup && (player.overall - bestBackup.overall < 5) && player.overall >= bestBackup.overall) {
                  battleIndicator = true
                }
              }

              return (
                <div 
                  key={slotKey}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, slotKey)}
                  className={`relative flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border-2 border-dashed transition-all ${
                    player ? 'bg-gradient-to-r from-[#00254c] to-[#00152b] border-[#004b93]/50 border-solid' : 'bg-transparent border-white/10 hover:border-accent/50 hover:bg-white/5'
                  }`}
                >
                  {/* Slot Label Overlay */}
                  <div className="absolute -top-2.5 -left-2.5 w-8 h-8 rounded-full bg-accent text-[#001021] flex items-center justify-center font-black text-xs border-2 border-[#001021] shadow-lg z-10">
                    {slotName}
                  </div>

                  {player ? (
                    <>
                      <div className="flex items-center gap-4 ml-6 w-full">
                        <div className="w-10 h-10 rounded flex items-center justify-center font-display font-bold text-sm bg-[#001021] text-white border border-[#005c99]">
                          {player.position}
                        </div>
                        <div className="flex-1">
                          <div className="text-white font-bold text-sm flex items-center gap-2 flex-wrap">
                            <span className={penalty > 0 ? 'text-red-400' : ''}>{player.overall >= 85 ? '⭐ ' : ''}{player.name}</span>
                            {details && (
                              <>
                                <span className="text-[10px] bg-white/10 px-1 rounded text-accent">Form: {details.form}</span>
                                {details.isRising && <span className="text-[10px] bg-green-500/20 text-green-400 px-1 rounded">↑</span>}
                                {details.isInjured && <span className="text-[10px] bg-red-500/20 text-red-400 px-1 rounded">🔒</span>}
                                {battleIndicator && (
                                  <button onClick={() => alert(`${player.name} yerini kaybedebilir! Onaylıyor musunuz? (Demo)`)} className="text-[10px] bg-orange-500/20 text-orange-400 px-1 rounded border border-orange-500/30 hover:bg-orange-500 hover:text-white">
                                    ⚔️ Savaş!
                                  </button>
                                )}
                                {captain === player.id && <span className="text-[10px] bg-yellow-400 text-[#001021] px-1 rounded font-black">©️ KAPTAN</span>}
                                {penalty > 0 && <span className="text-[10px] bg-red-500 text-white px-1 rounded flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> -{penalty}% OVR Cezası</span>}
                              </>
                            )}
                          </div>
                          <div className="text-white/50 text-xs font-bold mt-0.5 flex items-center gap-2">
                            <span>OVR: <strong className={penalty > 0 ? 'text-red-400 line-through' : 'text-white'}>{player.overall}</strong> {penalty > 0 && <span className="text-red-400">{player.overall - Math.floor(player.overall * penalty / 100)}</span>}</span>
                            <span>| DEĞER: ${(player.value / 1000000).toFixed(1)}M</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-2 sm:mt-0 ml-6 sm:ml-0">
                        {captain !== player.id && activeTab !== 'PS' && (
                          <button onClick={() => setCaptain(player.id)} className="text-[10px] uppercase font-bold text-white/40 hover:text-yellow-400 px-2 py-1 bg-white/5 hover:bg-white/10 rounded transition-colors whitespace-nowrap">
                            Kaptan Yap
                          </button>
                        )}
                        {activeTab === 'PS' && (
                          <button onClick={() => alert('Sürpriz oyuncu olarak işaretlendi! Sakatlık anında +20 adrenalin alacak.')} className="text-[10px] uppercase font-bold text-accent hover:text-white px-2 py-1 bg-accent/10 hover:bg-accent/30 rounded transition-colors border border-accent/20 whitespace-nowrap">
                            Sürpriz İlan Et
                          </button>
                        )}
                        <button onClick={() => removePlayerFromSlot(slotKey)} className="p-2 text-red-400 hover:bg-red-500/20 rounded">
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center w-full h-12 text-white/20 text-xs font-bold uppercase tracking-wider ml-6">
                      Oyuncuyu Buraya Sürükleyin
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

      </div>

      <button 
        onClick={handleSave} 
        disabled={isSaving}
        className="w-full osm-button bg-green-600 hover:bg-green-500 mt-8 py-4 text-lg flex items-center justify-center gap-2"
      >
        <Save className="w-6 h-6" />
        {isSaving ? 'KAYDEDİLİYOR...' : 'KADROYU ONAYLA'}
      </button>
    </div>
  )
}
