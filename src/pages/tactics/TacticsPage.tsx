import { useState, useEffect } from 'react'
import { useTactics } from '@/hooks/useTactics'
import { useFranchiseStore } from '@/store/franchiseStore'
import { supabase } from '@/lib/supabase'
import { Shield, Zap, ChevronRight, Activity, Crosshair, ShieldAlert, FastForward } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'

export function TacticsPage() {
  const { tactics, isLoading, mutate } = useTactics()
  const { franchise } = useFranchiseStore()
  const [isSaving, setIsSaving] = useState(false)
  
  const [sliders, setSliders] = useState({
    pass_ratio: 50,
    aggression: 50,
    tempo: 50,
    defense_line: 50
  })

  useEffect(() => {
    if (tactics?.slider_ayarlari) {
      setSliders(tactics.slider_ayarlari)
    }
  }, [tactics])

  if (isLoading) return (
    <div className="space-y-4 pt-4">
      <Skeleton className="h-12 w-full bg-white/5" />
      <Skeleton className="h-[400px] w-full bg-white/5" />
    </div>
  )

  const handleSave = async () => {
    if (!franchise) return
    setIsSaving(true)
    try {
      if (tactics?.id === 'new') {
        const { error } = await supabase.from('tactics').insert({
          franchise_id: franchise.id,
          slider_ayarlari: sliders,
          paketler: []
        })
        if (error) throw error
      } else {
        const { error } = await supabase.from('tactics').update({
          slider_ayarlari: sliders
        }).eq('franchise_id', franchise.id)
        if (error) throw error
      }
      mutate()
      alert('Taktikler başarıyla kaydedildi!')
    } catch (err: any) {
      alert('Hata: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const sliderConfig = [
    { key: 'pass_ratio', label: 'Oyun Tarzı', minLabel: 'Run Heavy', maxLabel: 'Pass Heavy', icon: Crosshair, color: 'text-blue-400', bg: 'bg-blue-500' },
    { key: 'aggression', label: 'Mücadele Sertliği', minLabel: 'Dikkatli', maxLabel: 'Agresif', icon: Zap, color: 'text-red-400', bg: 'bg-red-500' },
    { key: 'tempo', label: 'Oyun Temposu', minLabel: 'Yavaş', maxLabel: 'Hızlı Hücum', icon: FastForward, color: 'text-accent', bg: 'bg-accent' },
    { key: 'defense_line', label: 'Savunma Çizgisi', minLabel: 'Geride Bekle', maxLabel: 'Önde Baskı', icon: ShieldAlert, color: 'text-green-400', bg: 'bg-green-500' }
  ]

  return (
    <div className="space-y-6 pt-4 max-w-4xl mx-auto pb-20">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 bg-[#00152b]/80 p-4 rounded-xl border border-[#005c99]/30">
        <Activity className="h-8 w-8 text-accent" />
        <div>
          <h1 className="text-xl font-display font-bold text-white tracking-wider">TAKTİKLER</h1>
          <p className="text-white/60 text-xs font-bold uppercase">Maç öncesi stratejinizi belirleyin</p>
        </div>
      </div>

      <div className="grid gap-6">
        {sliderConfig.map((config) => {
          const value = (sliders as any)[config.key]
          const Icon = config.icon
          
          return (
            <div key={config.key} className="bg-gradient-to-r from-[#00254c] to-[#00152b] p-5 rounded-xl border border-[#004b93]/50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Icon className={`w-5 h-5 ${config.color}`} />
                  <span className="text-white font-bold uppercase tracking-wide">{config.label}</span>
                </div>
                <div className={`px-3 py-1 rounded bg-black/40 border border-[#005c99] text-white font-display font-bold text-lg`}>
                  {value}
                </div>
              </div>
              
              <div className="relative pt-2 pb-6">
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={value}
                  onChange={(e) => setSliders({...sliders, [config.key]: parseInt(e.target.value)})}
                  className="w-full h-2 bg-[#001021] rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, var(--color-accent) 0%, var(--color-accent) ${value}%, #001021 ${value}%, #001021 100%)`
                  }}
                />
                <div className="absolute top-8 left-0 right-0 flex justify-between text-[10px] font-bold text-white/50 uppercase tracking-wider">
                  <span>{config.minLabel}</span>
                  <span>Dengeli</span>
                  <span>{config.maxLabel}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <button 
        onClick={handleSave} 
        disabled={isSaving}
        className="w-full osm-button bg-green-600 hover:bg-green-500 mt-8 py-4 text-lg"
      >
        {isSaving ? 'KAYDEDİLİYOR...' : 'TAKTİKLERİ KAYDET'}
      </button>

    </div>
  )
}
