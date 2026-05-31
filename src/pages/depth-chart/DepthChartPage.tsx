import { useState, useEffect } from 'react'
import { useDepthChart } from '@/hooks/useDepthChart'
import { useRoster } from '@/hooks/useRoster'
import { useFranchiseStore } from '@/store/franchiseStore'
import { supabase } from '@/lib/supabase'
import { Shield, Save, X } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'

const OFFENSE_SLOTS = [
  { pos: 'QB', count: 1 }, { pos: 'RB', count: 1 }, { pos: 'WR', count: 3 },
  { pos: 'TE', count: 1 }, { pos: 'OL', count: 2 }
]
const DEFENSE_SLOTS = [
  { pos: 'DE', count: 4 }, { pos: 'LB', count: 3 }, { pos: 'CB', count: 2 }, { pos: 'S', count: 2 }
]
const SPECIAL_SLOTS = [{ pos: 'K', count: 1 }]
const PS_SLOTS = [{ pos: 'PS', count: 3 }]

export function DepthChartPage() {
  const { depthChart, isLoading: isDcLoading, mutate: mutateDc } = useDepthChart()
  const { roster, isLoading: isRosterLoading } = useRoster()
  const { franchise } = useFranchiseStore()
  const [activeTab, setActiveTab] = useState<'OFF' | 'DEF' | 'ST' | 'PS'>('OFF')
  const [isSaving, setIsSaving] = useState(false)
  
  // Local state to track selections before saving
  const [localDc, setLocalDc] = useState<Record<string, string | null>>({})

  // Initialize local state from DB
  useEffect(() => {
    if (depthChart && depthChart.length > 0) {
      const initial: Record<string, string | null> = {}
      // We need to map DB rows to our UI keys (unit_pos_index)
      // Group by unit+pos
      const grouped: Record<string, any[]> = {}
      depthChart.forEach(dc => {
        const key = `${dc.unit}_${dc.position}`
        if (!grouped[key]) grouped[key] = []
        grouped[key].push(dc)
      })

      Object.entries(grouped).forEach(([key, items]) => {
        items.forEach((item, index) => {
          initial[`${key}_${index}`] = item.player_id
        })
      })
      setLocalDc(initial)
    }
  }, [depthChart])

  const handleAutoFill = () => {
    if (!roster) return
    const newDc = { ...localDc }
    const usedIds = new Set(Object.values(newDc).filter(Boolean) as string[])

    const fillSlots = (slots: {pos: string, count: number}[], unit: string) => {
      slots.forEach(({pos, count}) => {
        const available = roster
          .filter(p => p.position === pos && !usedIds.has(p.id))
          .sort((a, b) => b.overall - a.overall)
        
        for (let i = 0; i < count; i++) {
          const slotKey = `${unit}_${pos}_${i}`
          if (!newDc[slotKey] && available[i]) {
            newDc[slotKey] = available[i].id
            usedIds.add(available[i].id)
          }
        }
      })
    }

    fillSlots(OFFENSE_SLOTS, 'OFF')
    fillSlots(DEFENSE_SLOTS, 'DEF')
    fillSlots(SPECIAL_SLOTS, 'ST')
    
    // PS slots just take highest potential young players (or lowest overall)
    // We'll just take whoever is left for auto-fill PS
    const availablePS = roster
          .filter(p => !usedIds.has(p.id))
          .sort((a, b) => a.overall - b.overall)
          
    for (let i = 0; i < 3; i++) {
      const slotKey = `PS_PS_${i}`
      if (!newDc[slotKey] && availablePS[i]) {
        newDc[slotKey] = availablePS[i].id
        usedIds.add(availablePS[i].id)
      }
    }

    setLocalDc(newDc)
  }

  const handleSave = async () => {
    if (!franchise) return
    setIsSaving(true)
    try {
      // Delete old depth chart
      await supabase.from('depth_charts').delete().eq('franchise_id', franchise.id)
      
      // Insert new
      const inserts = Object.entries(localDc)
        .filter(([_, playerId]) => playerId)
        .map(([key, playerId]) => {
          const [unit, pos] = key.split('_')
          return {
            franchise_id: franchise.id,
            player_id: playerId,
            unit,
            position: pos === 'PS' ? 'K' : pos as any // Hack for PS position constraint (if position ENUM applies to depth_chart)
            // Wait, the DB enum is player_position ('QB', 'RB', ...). 'PS' is not in player_position.
            // If the DB position column is ENUM, we can't save 'PS'. Let's see what the DB says.
          }
        })
        
      // Actually let's look at the actual player's position to save it correctly instead of 'PS'.
      const insertsWithRealPos = Object.entries(localDc)
        .filter(([_, playerId]) => playerId)
        .map(([key, playerId]) => {
          const [unit] = key.split('_')
          const player = roster?.find(r => r.id === playerId)
          return {
            franchise_id: franchise.id,
            player_id: playerId,
            unit: unit,
            position: player?.position as any
          }
        })
      
      if (insertsWithRealPos.length > 0) {
        const { error } = await supabase.from('depth_charts').insert(insertsWithRealPos)
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

  const [captain, setCaptain] = useState<string | null>(null)

  if (isDcLoading || isRosterLoading) return (
    <div className="space-y-4 pt-4">
      <Skeleton className="h-12 w-full bg-white/5" />
      <Skeleton className="h-[400px] w-full bg-white/5" />
    </div>
  )

  const getPlayerDetails = (id: string) => {
    const hash = id.split('-')[0] || '000'
    const num = parseInt(hash, 16) || 0
    const form = 60 + (num % 40) // 60% to 99%
    const isRising = form > 85
    const isInjured = form < 65
    return { form, isRising, isInjured }
  }

  const renderSlots = (slots: {pos: string, count: number}[], unit: string) => {
    return slots.map(({pos, count}) => {
      return Array.from({length: count}).map((_, i) => {
        const slotKey = `${unit}_${pos}_${i}`
        const playerId = localDc[slotKey]
        const player = roster?.find(r => r.id === playerId)

        let battleIndicator = false
        if (player && roster) {
          // Check if there is a backup within 5 OVR
          const backups = roster.filter(r => r.position === pos && r.id !== player.id)
          if (backups.length > 0) {
            const bestBackup = [...backups].sort((a, b) => b.overall - a.overall)[0]
            if (player.overall - bestBackup.overall < 5) {
              battleIndicator = true
            }
          }
        }

        const details = player ? getPlayerDetails(player.id) : null

        return (
          <div key={slotKey} className="flex flex-col sm:flex-row sm:items-center justify-between bg-gradient-to-r from-[#00254c] to-[#00152b] p-3 rounded-lg border border-[#004b93]/50 gap-3">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded flex items-center justify-center font-display font-bold text-sm bg-[#001021] text-white border border-[#005c99]">
                {pos === 'PS' ? (player ? player.position : 'PS') : pos}
              </div>
              <div>
                <div className="text-white font-bold text-sm flex items-center gap-2 flex-wrap">
                  {player ? (player.overall >= 85 ? '⭐ ' : '🔄 ') + player.name : 'Seçilmedi'}
                  {details && (
                    <>
                      <span className="text-[10px] bg-white/10 px-1 rounded text-accent">Form: {details.form}</span>
                      {details.isRising && <span className="text-[10px] bg-green-500/20 text-green-400 px-1 rounded">↑ Yükselişte</span>}
                      {details.isInjured && <span className="text-[10px] bg-red-500/20 text-red-400 px-1 rounded">🔒 Kilitli</span>}
                      {battleIndicator && <span className="text-[10px] bg-orange-500/20 text-orange-400 px-1 rounded border border-orange-500/30">⚔️ Savaş!</span>}
                      {captain === player.id && <span className="text-[10px] bg-yellow-400 text-[#001021] px-1 rounded font-black">©️ KAPTAN</span>}
                    </>
                  )}
                </div>
                {player && <div className="text-white/50 text-xs font-bold mt-0.5">OVR: {player.overall} | DEĞER: ${player.value.toLocaleString()}</div>}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {player && captain !== player.id && (
                <button onClick={() => setCaptain(player.id)} className="text-[10px] uppercase font-bold text-white/40 hover:text-yellow-400 px-2 py-1 bg-white/5 hover:bg-white/10 rounded transition-colors">
                  Kaptan Yap
                </button>
              )}
              {player ? (
                <button onClick={() => {
                  const newDc = {...localDc}
                  newDc[slotKey] = null
                  setLocalDc(newDc)
                }} className="p-2 text-red-400 hover:bg-red-500/20 rounded">
                  <X className="w-5 h-5" />
                </button>
              ) : (
                <div className="text-accent text-xs font-bold px-2 py-1 bg-accent/10 rounded border border-accent/30 cursor-pointer" onClick={handleAutoFill}>
                  OTO DOLDUR
                </div>
              )}
            </div>
          </div>
        )
      })
    })
  }

  return (
    <div className="space-y-4 pt-4 max-w-4xl mx-auto pb-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 bg-[#00152b]/80 p-4 rounded-xl border border-[#005c99]/30 gap-4">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-accent" />
          <div>
            <h1 className="text-xl font-display font-bold text-white tracking-wider">İLK 11 VE KADRO (DEPTH CHART)</h1>
            <p className="text-white/60 text-xs font-bold uppercase">Sahaya çıkacak kadroyu belirleyin</p>
          </div>
        </div>
        <button 
          onClick={handleAutoFill}
          className="px-4 py-2 bg-[#00254c] border border-accent text-accent font-bold text-xs rounded hover:bg-accent hover:text-[#00152b] transition-colors"
        >
          EN İYİLERİ SEÇ
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-[#00152b] p-1 rounded-lg border border-white/5">
        {[
          { id: 'OFF', label: 'HÜCUM (11)' },
          { id: 'DEF', label: 'SAVUNMA (11)' },
          { id: 'ST', label: 'ÖZEL (1)' },
          { id: 'PS', label: 'PRACTICE SQUAD (3)' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 text-[10px] sm:text-xs font-bold uppercase py-2 px-2 sm:px-4 rounded transition-all ${
              activeTab === tab.id 
                ? 'bg-accent text-[#00152b] shadow-[0_0_10px_rgba(255,156,0,0.5)]' 
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid gap-2 mt-4">
        {activeTab === 'OFF' && renderSlots(OFFENSE_SLOTS, 'OFF')}
        {activeTab === 'DEF' && renderSlots(DEFENSE_SLOTS, 'DEF')}
        {activeTab === 'ST' && renderSlots(SPECIAL_SLOTS, 'ST')}
        {activeTab === 'PS' && renderSlots(PS_SLOTS, 'PS')}
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
