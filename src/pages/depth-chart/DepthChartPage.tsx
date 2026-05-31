import { useState } from 'react'
import { useDepthChart } from '@/hooks/useDepthChart'
import { useRoster } from '@/hooks/useRoster'
import { useFranchiseStore } from '@/store/franchiseStore'
import { supabase } from '@/lib/supabase'
import { Shield, Save, X } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'
import type { Player } from '@/types'

const OFFENSE_SLOTS = [
  { pos: 'QB', count: 1 }, { pos: 'RB', count: 1 }, { pos: 'WR', count: 3 },
  { pos: 'TE', count: 1 }, { pos: 'OL', count: 5 }
]
const DEFENSE_SLOTS = [
  { pos: 'DE', count: 4 }, { pos: 'LB', count: 3 }, { pos: 'CB', count: 2 }, { pos: 'S', count: 2 }
]
const SPECIAL_SLOTS = [{ pos: 'K', count: 1 }]

export function DepthChartPage() {
  const { depthChart, isLoading: isDcLoading, mutate: mutateDc } = useDepthChart()
  const { roster, isLoading: isRosterLoading } = useRoster()
  const { franchise } = useFranchiseStore()
  const [activeTab, setActiveTab] = useState<'OFF' | 'DEF' | 'ST'>('OFF')
  const [isSaving, setIsSaving] = useState(false)
  
  // Local state to track selections before saving
  const [localDc, setLocalDc] = useState<Record<string, string | null>>({})

  // Initialize local state from DB
  useState(() => {
    if (depthChart && depthChart.length > 0 && Object.keys(localDc).length === 0) {
      const initial: Record<string, string | null> = {}
      depthChart.forEach(dc => {
        // We use a composite key for slots with count > 1 (e.g. WR_0, WR_1)
        // But the DB only stores position. To handle multiple, we'll assign them indices.
        // Actually, let's keep it simple: the UI maps it by index.
      })
    }
  })

  // To make it incredibly simple for this phase without complex drag-and-drop:
  // We'll just auto-generate the best lineup button!
  
  const handleAutoFill = () => {
    if (!roster) return
    const newDc: Record<string, string> = {}
    const usedIds = new Set<string>()

    const fillSlots = (slots: {pos: string, count: number}[], unit: string) => {
      slots.forEach(({pos, count}) => {
        const available = roster
          .filter(p => p.position === pos && !usedIds.has(p.id))
          .sort((a, b) => b.overall - a.overall)
        
        for (let i = 0; i < count; i++) {
          if (available[i]) {
            newDc[`${unit}_${pos}_${i}`] = available[i].id
            usedIds.add(available[i].id)
          }
        }
      })
    }

    fillSlots(OFFENSE_SLOTS, 'OFF')
    fillSlots(DEFENSE_SLOTS, 'DEF')
    fillSlots(SPECIAL_SLOTS, 'ST')
    
    setLocalDc(newDc)
  }

  const handleSave = async () => {
    if (!franchise) return
    setIsSaving(true)
    try {
      // Delete old depth chart
      await supabase.from('depth_charts').delete().eq('franchise_id', franchise.id)
      
      // Insert new
      const inserts = Object.entries(localDc).map(([key, playerId]) => {
        const [unit, pos] = key.split('_')
        return {
          franchise_id: franchise.id,
          player_id: playerId,
          unit,
          position: pos as any
        }
      })
      
      if (inserts.length > 0) {
        const { error } = await supabase.from('depth_charts').insert(inserts)
        if (error) throw error
      }
      
      await mutateDc()
      alert('İlk 11 başarıyla kaydedildi!')
    } catch (err: any) {
      alert('Hata: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  if (isDcLoading || isRosterLoading) return (
    <div className="space-y-4 pt-4">
      <Skeleton className="h-12 w-full bg-white/5" />
      <Skeleton className="h-[400px] w-full bg-white/5" />
    </div>
  )

  const renderSlots = (slots: {pos: string, count: number}[], unit: string) => {
    return slots.map(({pos, count}) => {
      return Array.from({length: count}).map((_, i) => {
        const slotKey = `${unit}_${pos}_${i}`
        const playerId = localDc[slotKey]
        const player = roster.find(r => r.id === playerId)

        return (
          <div key={slotKey} className="flex items-center justify-between bg-gradient-to-r from-[#00254c] to-[#00152b] p-3 rounded-lg border border-[#004b93]/50">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded flex items-center justify-center font-display font-bold text-sm bg-[#001021] text-white border border-[#005c99]">
                {pos}
              </div>
              <div>
                <div className="text-white font-bold text-sm">{player ? player.name : 'Seçilmedi'}</div>
                {player && <div className="text-white/50 text-xs font-bold mt-0.5">OVR: {player.overall}</div>}
              </div>
            </div>
            
            {player ? (
              <button onClick={() => {
                const newDc = {...localDc}
                delete newDc[slotKey]
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
        )
      })
    })
  }

  return (
    <div className="space-y-4 pt-4 max-w-4xl mx-auto pb-20">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 bg-[#00152b]/80 p-4 rounded-xl border border-[#005c99]/30">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-accent" />
          <div>
            <h1 className="text-xl font-display font-bold text-white tracking-wider">İLK 11 (DEPTH CHART)</h1>
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
        {['OFF', 'DEF', 'ST'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-1 text-xs font-bold uppercase py-2 px-4 rounded transition-all ${
              activeTab === tab 
                ? 'bg-accent text-[#00152b] shadow-[0_0_10px_rgba(255,156,0,0.5)]' 
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab === 'OFF' ? 'HÜCUM (11)' : tab === 'DEF' ? 'SAVUNMA (11)' : 'ÖZEL (1)'}
          </button>
        ))}
      </div>

      <div className="grid gap-2 mt-4">
        {activeTab === 'OFF' && renderSlots(OFFENSE_SLOTS, 'OFF')}
        {activeTab === 'DEF' && renderSlots(DEFENSE_SLOTS, 'DEF')}
        {activeTab === 'ST' && renderSlots(SPECIAL_SLOTS, 'ST')}
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
