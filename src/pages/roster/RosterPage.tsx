import { useState } from 'react'
import { useRoster } from '@/hooks/useRoster'
import { Card, CardContent } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { Shield, ChevronRight } from 'lucide-react'
import { useFranchiseStore } from '@/store/franchiseStore'
import { supabase } from '@/lib/supabase'
import { TraitBadge } from '@/components/ui/TraitBadge'

const OFFENSE_POS = ['QB', 'RB', 'WR', 'TE', 'OL']
const DEFENSE_POS = ['DE', 'LB', 'CB', 'S']
const SPECIAL_POS = ['K']

export function RosterPage() {
  const { roster, isLoading } = useRoster()
  const [activeTab, setActiveTab] = useState<'ALL' | 'OFF' | 'DEF' | 'ST'>('ALL')
  const [isSelling, setIsSelling] = useState<string | null>(null)
  const { franchise, setFranchise } = useFranchiseStore()

  if (isLoading) return (
    <div className="space-y-4 pt-4">
      <Skeleton className="h-12 w-full bg-white/5" />
      <Skeleton className="h-[400px] w-full bg-white/5" />
    </div>
  )

  const filteredRoster = roster.filter(p => {
    if (activeTab === 'ALL') return true
    if (activeTab === 'OFF') return OFFENSE_POS.includes(p.position)
    if (activeTab === 'DEF') return DEFENSE_POS.includes(p.position)
    if (activeTab === 'ST') return SPECIAL_POS.includes(p.position)
    return true
  })

  // Determine age and form deterministically based on player ID or just mock it for UI
  const getPlayerDetails = (id: string) => {
    const hash = id.split('-')[0] || '000'
    const num = parseInt(hash, 16) || 0
    const age = 20 + (num % 15) // 20 to 34
    const form = 60 + (num % 40) // 60% to 99%
    return { age, form }
  }

  // Split into Main and Practice
  // For simplicity, top 22 by overall are Main, rest are Practice
  const sortedFiltered = [...filteredRoster].sort((a, b) => b.overall - a.overall)
  const mainRoster = sortedFiltered.slice(0, 22)
  const practiceSquad = sortedFiltered.slice(22)

  const handleListForSale = async (player: any) => {
    if (!franchise) return
    const priceStr = prompt(`${player.name} için satış bedeli giriniz (Mevcut değer: $${(player.value / 1000000).toFixed(1)}M):`, player.value.toString())
    if (!priceStr) return
    const listPrice = parseInt(priceStr, 10)
    if (isNaN(listPrice) || listPrice < 1000) return alert('Geçersiz fiyat.')

    if (confirm(`${player.name} isimli oyuncuyu $${(listPrice / 1000000).toFixed(1)}M karşılığında transfer listesine koymak istediğinize emin misiniz? (%5 kesinti uygulanır)`)) {
      setIsSelling(player.id)
      try {
        const { data, error } = await supabase.functions.invoke('market-transactions', {
          body: { action: 'list_player', player_id: player.id, franchise_id: franchise.id, list_price: listPrice }
        })
        if (error) throw error
        if (data?.error) throw new Error(data.error)
        alert('Oyuncu transfer listesine eklendi!')
        window.location.reload()
      } catch (err: any) {
        alert('Hata: ' + err.message)
      } finally {
        setIsSelling(null)
      }
    }
  }

  const handleSell = async (player: any) => {
    if (!franchise) return
    const sellValue = Math.floor(player.value * 0.8) // 80% of value
    if (confirm(`${player.name} isimli oyuncuyu $${(sellValue / 1000000).toFixed(1)}M karşılığında sisteme satmak (serbest bırakmak) istediğinize emin misiniz?`)) {
      setIsSelling(player.id)
      try {
        const { error: updateError } = await supabase
          .from('players')
          .update({ franchise_id: null, status: 'free_agent' })
          .eq('id', player.id)
          
        if (updateError) throw updateError

        const { error: fundError } = await supabase
          .from('franchises')
          .update({ budget: franchise.budget + sellValue })
          .eq('id', franchise.id)
          
        if (fundError) throw fundError

        setFranchise({ ...franchise, budget: franchise.budget + sellValue })
        alert('Oyuncu başarıyla satıldı!')
        window.location.reload()
      } catch (err: any) {
        alert('Hata: ' + err.message)
      } finally {
        setIsSelling(null)
      }
    }
  }

  const renderPlayerCard = (player: any) => {
    const { age, form } = getPlayerDetails(player.id)
    const traits: string[] = player.traits || []
    return (
      <div 
        key={player.id} 
        className="flex items-center justify-between bg-gradient-to-r from-[#00254c] to-[#00152b] p-3 rounded-lg border border-[#004b93]/50 hover:border-accent/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded flex items-center justify-center font-display font-bold text-sm shadow-inner ${
            OFFENSE_POS.includes(player.position) ? 'bg-blue-900/50 text-blue-300 border border-blue-500/30' :
            DEFENSE_POS.includes(player.position) ? 'bg-red-900/50 text-red-300 border border-red-500/30' :
            'bg-yellow-900/50 text-yellow-300 border border-yellow-500/30'
          }`}>
            {player.position}
          </div>
          <div>
            <div className="text-white font-bold text-sm flex items-center gap-2">
              {player.name}
              <span className="text-[10px] bg-white/10 px-1 rounded text-white/50">{age} Yaş</span>
              <span className="text-[10px] bg-white/10 px-1 rounded text-accent">🔥 %{form}</span>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <div className="text-green-400 text-xs font-bold mr-2">${(player.value / 1000000).toFixed(1)}M</div>
              {traits.map((trait, i) => (
                <TraitBadge key={i} trait={trait} />
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {player.status === 'listed_for_sale' ? (
            <div className="text-[10px] uppercase font-bold px-2 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded">
              Listede ($${((player.listed_price || 0) / 1000000).toFixed(1)}M)
            </div>
          ) : (
            <button 
              onClick={() => handleListForSale(player)}
              disabled={isSelling === player.id}
              className="text-[10px] uppercase font-bold px-2 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-500 hover:text-white transition-colors"
            >
              Listele
            </button>
          )}
          <button 
            onClick={() => handleSell(player)}
            disabled={isSelling === player.id || player.status === 'listed_for_sale'}
            className="text-[10px] uppercase font-bold px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded hover:bg-red-500 hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-red-500/20 disabled:hover:text-red-400"
          >
            {isSelling === player.id ? '...' : 'Serbest Bırak'}
          </button>
          <div className="flex flex-col items-center justify-center w-12 h-12 rounded-full bg-[#001021] border-2 border-[#005c99] ml-2">
            <span className="text-white font-display font-bold text-lg leading-none">{player.overall}</span>
          </div>
          <ChevronRight className="w-5 h-5 text-white/30" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 pt-4 max-w-4xl mx-auto pb-20">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 bg-[#00152b]/80 p-4 rounded-xl border border-[#005c99]/30">
        <Shield className="h-8 w-8 text-accent" />
        <div>
          <h1 className="text-xl font-display font-bold text-white tracking-wider">KADRO</h1>
          <p className="text-white/60 text-xs font-bold uppercase">{roster.length} / 25 Oyuncu</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-[#00152b] p-1 rounded-lg border border-white/5 overflow-x-auto hide-scrollbar">
        {['ALL', 'OFF', 'DEF', 'ST'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-1 min-w-[80px] text-xs font-bold uppercase py-2 px-4 rounded transition-all ${
              activeTab === tab 
                ? 'bg-accent text-[#00152b] shadow-[0_0_10px_rgba(255,156,0,0.5)]' 
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab === 'ALL' ? 'TÜMÜ' : tab === 'OFF' ? 'HÜCUM' : tab === 'DEF' ? 'SAVUNMA' : 'ÖZEL'}
          </button>
        ))}
      </div>

      {/* Roster List */}
      <div className="grid gap-2 mt-4">
        {mainRoster.length > 0 && (
          <>
            <div className="text-xs font-bold uppercase text-white/50 mt-2 mb-1">Ana Kadro (A Takım) - {mainRoster.length}/22</div>
            {mainRoster.map(renderPlayerCard)}
          </>
        )}

        {practiceSquad.length > 0 && (
          <>
            <div className="text-xs font-bold uppercase text-accent mt-6 mb-1 flex items-center gap-2">
              Gelişim Takımı (Practice Squad) - {practiceSquad.length}/3
              <span className="bg-accent/20 text-accent text-[9px] px-1.5 py-0.5 rounded">GELİŞİMDE</span>
            </div>
            <div className="opacity-80">
              {practiceSquad.map(renderPlayerCard)}
            </div>
          </>
        )}
        
        {filteredRoster.length === 0 && (
          <div className="text-center py-12 text-white/50 text-sm font-bold border border-dashed border-white/10 rounded-xl">
            {activeTab === 'ALL' ? 'Kadronuzda oyuncu bulunmuyor. Transfer piyasasından oyuncu alın veya liginizi admin panelinden botlarla doldurun.' : 'Bu mevkide oyuncu bulunmuyor.'}
          </div>
        )}
      </div>

    </div>
  )
}
