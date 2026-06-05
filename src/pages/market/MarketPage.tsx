import { useState } from 'react'
import { useMarket } from '@/hooks/useMarket'
import { useFranchiseStore } from '@/store/franchiseStore'
import { supabase } from '@/lib/supabase'
import { ShoppingCart, DollarSign, ArrowRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'
import { TraitBadge } from '@/components/ui/TraitBadge'
import { ScoutModal } from './ScoutModal'
import { Search } from 'lucide-react'

export function MarketPage() {
  const { freeAgents, isLoading, mutate } = useMarket()
  const { franchise, setFranchise } = useFranchiseStore()
  const [buyingId, setBuyingId] = useState<string | null>(null)
  const [isScoutModalOpen, setIsScoutModalOpen] = useState(false)

  if (isLoading) return (
    <div className="space-y-4 pt-4">
      <Skeleton className="h-12 w-full bg-white/5" />
      <Skeleton className="h-[400px] w-full bg-white/5" />
    </div>
  )

  const handleBuy = async (playerId: string, cost: number) => {
    if (!franchise || franchise.club_fund < cost) return alert('Yetersiz bütçe!')
    setBuyingId(playerId)
    try {
      const { data, error } = await supabase.rpc('buy_free_agent', {
        p_franchise_id: franchise.id,
        p_player_id: playerId
      })
      
      if (error) throw error
      
      if (data && data.success) {
        setFranchise({ ...franchise, club_fund: franchise.club_fund - cost })
        mutate()
        alert('Oyuncu başarıyla transfer edildi!')
      } else {
        alert('Hata: ' + (data?.error || 'Bilinmeyen hata'))
      }
    } catch (e: any) {
      alert('Hata: ' + e.message)
    } finally {
      setBuyingId(null)
    }
  }

  return (
    <div className="space-y-4 pt-4 max-w-4xl mx-auto pb-20">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 bg-[#00152b]/80 p-4 rounded-xl border border-[#005c99]/30">
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-8 w-8 text-accent" />
          <div>
            <h1 className="text-xl font-display font-bold text-white tracking-wider">TRANSFER PİYASASI</h1>
            <p className="text-white/60 text-xs font-bold uppercase">Serbest Oyuncular (FA)</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setIsScoutModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-accent to-yellow-500 text-[#001021] font-bold rounded-lg shadow-[0_0_15px_rgba(255,156,0,0.4)] hover:shadow-[0_0_25px_rgba(255,156,0,0.6)] hover:scale-105 transition-all"
          >
            <Search className="w-4 h-4" />
            ÖZEL SCOUT
          </button>
          <div className="text-right">
            <p className="text-white/60 text-xs font-bold uppercase">KULÜP BÜTÇESİ</p>
            <p className="text-green-400 font-display font-bold text-lg flex items-center gap-1 justify-end">
              <DollarSign className="w-4 h-4" />
              {franchise?.club_fund.toLocaleString()}
            </p>
          </div>
      </div>
      </div>

      {/* Roster List */}
      <div className="grid gap-3 mt-4">
        {freeAgents.map(player => (
          <div 
            key={player.id} 
            className="flex flex-col sm:flex-row items-center justify-between bg-gradient-to-r from-[#00254c] to-[#00152b] p-4 rounded-xl border border-[#004b93]/50 hover:border-accent/50 transition-colors gap-4"
          >
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="flex flex-col items-center justify-center w-14 h-14 rounded-full bg-[#001021] border-2 border-accent/50 shadow-[0_0_10px_rgba(255,156,0,0.2)]">
                <span className="text-white font-display font-bold text-xl leading-none">{player.overall}</span>
              </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-white/10 text-white text-[10px] font-bold border border-white/20">
                      {player.position}
                    </span>
                    <span className="text-white font-bold text-lg">{player.name}</span>
                  </div>
                  {player.traits && player.traits.length > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      {player.traits.map((trait: string, idx: number) => (
                        <TraitBadge key={idx} trait={trait} />
                      ))}
                    </div>
                  )}
                </div>
            </div>
            
            <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto mt-2 sm:mt-0">
              <div className="text-left sm:text-right">
                <div className="text-white/50 text-[10px] font-bold uppercase">Bonservis Bedeli</div>
                <div className="text-green-400 font-bold text-lg">
                  ${(player.value / 1000000).toFixed(1)}M
                </div>
              </div>
              
              <button 
                onClick={() => handleBuy(player.id, player.value)}
                disabled={buyingId === player.id || (franchise?.club_fund || 0) < player.value}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-400 text-white font-bold text-sm rounded-lg transition-all"
              >
                {buyingId === player.id ? 'İŞLENİYOR...' : 'SATIN AL'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        
        {freeAgents.length === 0 && (
          <div className="text-center py-16 text-white/50 font-bold border border-dashed border-white/10 rounded-xl">
            <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Piyasada serbest oyuncu bulunmuyor.</p>
            <p className="text-sm font-normal mt-2">Admin panelinden pazar yenilemesi bekleyin.</p>
          </div>
        )}
      </div>

      <ScoutModal isOpen={isScoutModalOpen} onClose={() => setIsScoutModalOpen(false)} />
    </div>
  )
}
