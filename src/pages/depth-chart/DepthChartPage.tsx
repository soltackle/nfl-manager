import { useState, useEffect } from 'react'
import { useDepthChart } from '@/hooks/useDepthChart'
import { useRoster } from '@/hooks/useRoster'
import { useFranchiseStore } from '@/store/franchiseStore'
import { supabase } from '@/lib/supabase'
import { Shield, Save, X, GripVertical, AlertTriangle, Plus } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'

const PITCH_SLOTS: Record<string, string[]> = {
  'OFF': ['QB1', 'RB1', 'WR1', 'WR2', 'WR3', 'TE1', 'OL1', 'OL2'],
  'DEF': ['DE1', 'DE2', 'LB1', 'LB2', 'LB3', 'CB1', 'CB2', 'S1'],
  'ST': ['K1', 'P1'],
  'PS': ['PS1', 'PS2', 'PS3']
}

const BENCH_SLOTS: Record<string, string[]> = {
  'OFF': ['QB2', 'RB2', 'WR4', 'TE2'],
  'DEF': [],
  'ST': [],
  'PS': []
}

const slotCoordinates: Record<string, { top: string, left: string }> = {
  // OFFENSE (Attacking right. Left side is our backfield)
  'OFF_QB1': { top: '50%', left: '25%' },
  'OFF_RB1': { top: '50%', left: '12%' },
  'OFF_OL1': { top: '35%', left: '38%' },
  'OFF_OL2': { top: '65%', left: '38%' },
  'OFF_TE1': { top: '20%', left: '42%' },
  'OFF_WR1': { top: '10%', left: '55%' },
  'OFF_WR2': { top: '90%', left: '55%' },
  'OFF_WR3': { top: '25%', left: '50%' },
  
  // DEFENSE (Defending left. Right side is their backfield)
  'DEF_DE1': { top: '35%', left: '62%' },
  'DEF_DE2': { top: '65%', left: '62%' },
  'DEF_LB1': { top: '20%', left: '45%' },
  'DEF_LB2': { top: '50%', left: '48%' },
  'DEF_LB3': { top: '80%', left: '45%' },
  'DEF_CB1': { top: '15%', left: '75%' },
  'DEF_CB2': { top: '85%', left: '75%' },
  'DEF_S1': { top: '50%', left: '25%' },
  
  // ST
  'ST_K1': { top: '40%', left: '50%' },
  'ST_P1': { top: '60%', left: '50%' },
  
  // PS
  'PS_PS1': { top: '30%', left: '50%' },
  'PS_PS2': { top: '50%', left: '50%' },
  'PS_PS3': { top: '70%', left: '50%' }
}

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
  
  const [localDc, setLocalDc] = useState<Record<string, string | null>>({})

  useEffect(() => {
    if (depthChart && depthChart.length > 0) {
      const initial: Record<string, string | null> = {}
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

    ['OFF', 'DEF', 'ST', 'PS'].forEach(unit => {
      fillSlots(PITCH_SLOTS[unit], unit)
      fillSlots(BENCH_SLOTS[unit], unit)
    })

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
    const form = 60 + (num % 40)
    return { form, isRising: form > 85, isInjured: form < 65 }
  }

  // Drag and Drop
  const handleDragStart = (e: React.DragEvent, playerId: string) => {
    e.dataTransfer.setData('playerId', playerId)
  }

  const handleDrop = (e: React.DragEvent, targetSlotKey: string) => {
    e.preventDefault()
    const draggedPlayerId = e.dataTransfer.getData('playerId')
    if (!draggedPlayerId) return

    const newDc = { ...localDc }
    const existingSlotKey = Object.keys(newDc).find(k => newDc[k] === draggedPlayerId)
    const occupantId = newDc[targetSlotKey]

    if (occupantId) {
      if (existingSlotKey) {
        newDc[existingSlotKey] = occupantId
      }
    } else {
      if (existingSlotKey) {
        newDc[existingSlotKey] = null
      }
    }

    newDc[targetSlotKey] = draggedPlayerId
    setLocalDc(newDc)
  }

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault() }

  const removePlayer = (slotKey: string) => {
    const newDc = { ...localDc }
    newDc[slotKey] = null
    setLocalDc(newDc)
  }

  const getPenalty = (realPos: string, slotPos: string) => {
    if (slotPos === 'PS' || realPos === slotPos) return 0
    if ((realPos === 'WR' && slotPos === 'TE') || (realPos === 'TE' && slotPos === 'WR')) return 15
    if (realPos === 'RB' && slotPos === 'WR') return 20
    if ((realPos === 'DE' || realPos === 'DT') && slotPos === 'LB') return 10
    if (realPos === 'LB' && (slotPos === 'DE' || slotPos === 'DT')) return 10
    return 50
  }

  if (isDcLoading || isRosterLoading || !roster) return (
    <div className="space-y-4 pt-4 max-w-6xl mx-auto">
      <Skeleton className="h-12 w-full bg-white/5" />
      <Skeleton className="h-[600px] w-full bg-white/5" />
    </div>
  )

  const allowedPositionsForTab = 
    activeTab === 'OFF' ? ['QB', 'RB', 'WR', 'TE', 'OL'] :
    activeTab === 'DEF' ? ['DE', 'DT', 'LB', 'CB', 'S'] :
    activeTab === 'ST' ? ['K', 'P'] : []

  const unassignedPlayers = roster.filter(p => {
    const isAssigned = Object.values(localDc).includes(p.id)
    if (isAssigned) return false
    if (activeTab === 'PS') return true
    return allowedPositionsForTab.includes(p.position)
  }).sort((a, b) => b.overall - a.overall)

  const renderSlot = (slotName: string, isPitch: boolean) => {
    const slotKey = `${activeTab}_${slotName}`
    const playerId = localDc[slotKey]
    const player = roster?.find(r => r.id === playerId)
    const coords = slotCoordinates[slotKey] || { top: '50%', left: '50%' }
    const basePos = getBasePosition(slotName)

    let penalty = 0
    let battleIndicator = false
    let isInjured = false

    if (player) {
      penalty = getPenalty(player.position, basePos)
      const details = getPlayerDetails(player.id)
      isInjured = details.isInjured
      
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
        draggable={!!player}
        onDragStart={player ? (e) => handleDragStart(e, player.id) : undefined}
        className={`
          ${isPitch ? 'absolute -translate-x-1/2 -translate-y-1/2' : 'relative flex-shrink-0'}
          w-[72px] sm:w-[84px] transition-transform hover:scale-105 z-10
        `}
        style={isPitch ? { top: coords.top, left: coords.left } : {}}
      >
        {player ? (
          <div className="bg-gradient-to-b from-[#003b73] to-[#00152b] rounded-lg border-2 border-accent shadow-xl text-center overflow-hidden cursor-grab active:cursor-grabbing group">
             {/* Position Header */}
             <div className="bg-accent text-[#001021] text-[10px] font-black w-full text-center tracking-widest uppercase">
               {slotName}
             </div>
             
             {/* Player Info */}
             <div className="py-1.5 px-1 relative">
               <div className="text-[9px] sm:text-[10px] font-bold text-white/90 truncate leading-tight">
                 {player.name.split(' ').slice(1).join(' ') || player.name}
               </div>
               <div className={`text-xl sm:text-2xl font-display font-black leading-none mt-1 ${penalty > 0 ? 'text-red-400' : 'text-white'}`}>
                 {penalty > 0 ? player.overall - Math.floor(player.overall * penalty / 100) : player.overall}
               </div>
               
               {/* Badges/Icons absolute overlay */}
               {captain === player.id && <div className="absolute bottom-1 right-1 w-4 h-4 bg-yellow-400 rounded-full text-[#001021] text-[9px] font-black flex items-center justify-center">C</div>}
               {isInjured && <div className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center"><X className="w-2 h-2 text-white"/></div>}
             </div>
             
             {/* Battle / Penalty Indicator Strip */}
             {(penalty > 0 || battleIndicator) && (
               <div className={`text-[8px] font-bold py-0.5 text-center ${penalty > 0 ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'}`}>
                 {penalty > 0 ? `-${penalty}% OVR` : '⚔️ SAVAŞ'}
               </div>
             )}

             {/* Remove Button (Hover) */}
             <button 
               onClick={(e) => { e.stopPropagation(); removePlayer(slotKey); }} 
               className="hidden group-hover:flex absolute -top-2 -right-2 bg-red-500 rounded-full w-5 h-5 items-center justify-center text-white shadow-lg"
             >
               <X className="w-3 h-3" />
             </button>
          </div>
        ) : (
          <div className="bg-[#001021]/60 rounded-lg border-2 border-dashed border-white/20 h-[80px] sm:h-[90px] flex flex-col items-center justify-center text-center hover:border-accent/50 hover:bg-[#00152b]/80 transition-colors">
             <div className="text-white/40 text-[11px] font-black uppercase tracking-wider">{slotName}</div>
             <Plus className="w-5 h-5 text-white/20 mt-1" />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="pt-4 max-w-7xl mx-auto pb-20 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 bg-[#00152b]/80 p-4 rounded-xl border border-[#005c99]/30">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-accent" />
          <div>
            <h1 className="text-xl font-display font-bold text-white tracking-wider">İLK 11 VE YEDEKLER</h1>
            <p className="text-white/60 text-xs font-bold uppercase">Sürükle-bırak ile sahaya oyuncu yerleştirin</p>
          </div>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <button onClick={handleAutoFill} className="px-4 py-2 bg-[#00254c] border border-accent text-accent font-bold text-xs rounded hover:bg-accent hover:text-[#00152b] transition-colors">
            OTO DOLDUR
          </button>
          <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold text-xs rounded transition-colors flex items-center gap-2">
            <Save className="w-4 h-4" /> {isSaving ? 'KAYDEDİLİYOR...' : 'KAYDET'}
          </button>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Center: Pitch & Bench */}
        <div className="flex-1 flex flex-col gap-4">
          
          {/* Tabs */}
          <div className="flex gap-2 bg-[#00152b] p-1 rounded-lg border border-white/5 overflow-x-auto hide-scrollbar">
            {[
              { id: 'OFF', label: `HÜCUM` },
              { id: 'DEF', label: `SAVUNMA` },
              { id: 'ST', label: `ÖZEL` },
              { id: 'PS', label: `PS` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 min-w-[80px] text-xs font-bold uppercase py-2.5 px-2 rounded transition-all ${
                  activeTab === tab.id ? 'bg-accent text-[#00152b] shadow-[0_0_10px_rgba(255,156,0,0.5)]' : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* THE PITCH */}
          <div 
            className="relative w-full h-[400px] sm:h-[500px] lg:h-[600px] bg-[#00152b] rounded-xl overflow-hidden border-2 border-[#005c99] shadow-[inset_0_0_80px_rgba(0,0,0,0.8)]"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)
              `,
              backgroundSize: '10% 20%'
            }}
          >
            {/* Field Decoration */}
            <div className="absolute inset-0 flex flex-col justify-between py-[10%] opacity-20 pointer-events-none">
              <div className="w-full border-t border-dashed border-white/50"></div>
              <div className="w-full border-t-2 border-solid border-white/30"></div>
              <div className="w-full border-t border-dashed border-white/50"></div>
            </div>
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 opacity-5 pointer-events-none">
              <Shield className="w-full h-full text-white" />
            </div>

            {/* Pitch Slots Map */}
            {PITCH_SLOTS[activeTab].map(slot => renderSlot(slot, true))}
          </div>

          {/* BENCH (YEDEKLER) */}
          {BENCH_SLOTS[activeTab].length > 0 && (
            <div className="bg-[#00152b]/80 p-4 rounded-xl border border-white/10">
              <h3 className="text-[10px] sm:text-xs font-bold text-white/50 uppercase mb-3 tracking-widest">Yedek Kulübesi (Bench)</h3>
              <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
                {BENCH_SLOTS[activeTab].map(slot => renderSlot(slot, false))}
              </div>
            </div>
          )}

        </div>

        {/* Right Sidebar: Unassigned Players */}
        <div className="w-full lg:w-80 bg-[#00152b]/80 p-4 rounded-xl border border-white/10 h-[600px] lg:h-auto flex flex-col">
          <h3 className="text-[10px] sm:text-xs font-bold text-white/50 uppercase mb-3 tracking-widest">Kadro Dışı (Sürükle)</h3>
          
          <div className="flex-1 overflow-y-auto space-y-2 hide-scrollbar pr-1">
            {unassignedPlayers.length === 0 ? (
              <div className="text-center py-12 text-white/30 text-xs font-bold border border-dashed border-white/5 rounded-lg">
                Tüm oyuncular yerleştirildi.
              </div>
            ) : unassignedPlayers.map(player => {
              const { form, isInjured } = getPlayerDetails(player.id)
              return (
                <div 
                  key={player.id} 
                  draggable 
                  onDragStart={(e) => handleDragStart(e, player.id)}
                  className="flex items-center gap-3 bg-[#001021] p-2 rounded-lg border border-white/5 hover:border-accent/50 cursor-grab active:cursor-grabbing transition-colors group"
                >
                  <GripVertical className="w-4 h-4 text-white/20 group-hover:text-accent flex-shrink-0" />
                  
                  <div className="w-10 h-10 rounded bg-[#00254c] text-white flex flex-col items-center justify-center font-bold border border-[#005c99] flex-shrink-0">
                    <span className="text-[8px] text-white/50 leading-none">{player.position}</span>
                    <span className="text-sm font-display leading-tight">{player.overall}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-xs sm:text-sm font-bold truncate">
                      {player.overall >= 85 ? '⭐' : ''} {player.name}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] sm:text-[10px] bg-white/10 px-1 rounded text-accent whitespace-nowrap">🔥 Form: {form}</span>
                      {isInjured && <span className="text-[9px] sm:text-[10px] text-red-400 whitespace-nowrap">🔒 Sakat</span>}
                    </div>
                  </div>
                  
                  {/* Kaptan/Sürpriz Mini Butonlar */}
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    {activeTab !== 'PS' && (
                      <button onClick={() => setCaptain(player.id)} className={`text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded ${captain === player.id ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white/50 hover:bg-white/20'}`}>
                        {captain === player.id ? 'KAPTAN' : 'KAPTAN YAP'}
                      </button>
                    )}
                    {activeTab === 'PS' && (
                      <button onClick={() => alert('Sürpriz seçildi!')} className="text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded bg-accent/20 text-accent hover:bg-accent hover:text-black">
                        SÜRPRİZ
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
