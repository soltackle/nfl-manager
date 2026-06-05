import { useState, useEffect } from 'react'
import { useFranchiseStore } from '@/store/franchiseStore'
import { supabase } from '@/lib/supabase'
import { ShoppingCart, DollarSign, ArrowRight, ArrowLeftRight, UserCheck, Search, ShieldAlert, List } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'
import { Player, TradeOffer } from '@/types'
import { Layout } from '@/components/Layout'

export function MarketPage() {
  const { franchise, league } = useFranchiseStore()
  const [activeTab, setActiveTab] = useState<'fa' | 'transfer' | 'trades'>('fa')
  
  const [freeAgents, setFreeAgents] = useState<Player[]>([])
  const [listedPlayers, setListedPlayers] = useState<Player[]>([])
  const [tradeOffers, setTradeOffers] = useState<TradeOffer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!franchise || !league) return
    fetchMarketData()
  }, [franchise, league, activeTab])

  const fetchMarketData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'fa') {
        const { data } = await supabase.from('players').select('*').eq('league_id', league!.id).eq('status', 'free_agent').order('overall', { ascending: false }).limit(50)
        setFreeAgents(data || [])
      } else if (activeTab === 'transfer') {
        const { data } = await supabase.from('players').select('*, franchises(team_name)').eq('league_id', league!.id).eq('status', 'listed_for_sale').order('listed_price', { ascending: false })
        setListedPlayers(data || [])
      } else if (activeTab === 'trades') {
        const { data } = await supabase.from('trade_offers').select('*, sender:sender_franchise_id(team_name), receiver:receiver_franchise_id(team_name)').eq('league_id', league!.id).in('status', ['pending', 'accepted'])
        setTradeOffers(data || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleBuyFA = async (player: Player) => {
    if (!franchise) return
    if (franchise.budget < player.value) return alert('Yetersiz Bütçe')
    if (!confirm(`${player.name} oyuncusunu $${player.value} karşılığında transfer etmek istiyor musun?`)) return
    
    try {
      const { data, error } = await supabase.functions.invoke('market-transactions', {
        body: { action: 'buy_fa', player_id: player.id, franchise_id: franchise.id }
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      alert('Transfer başarılı!')
      fetchMarketData()
      window.location.reload()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleBuyListed = async (player: Player) => {
    if (!franchise || !player.listed_price) return
    if (franchise.budget < player.listed_price) return alert('Yetersiz Bütçe')
    if (player.franchise_id === franchise.id) return alert('Kendi oyuncunuzu alamazsınız.')
    
    if (!confirm(`${player.name} oyuncusunu $${player.listed_price} karşılığında transfer etmek istiyor musun?`)) return
    
    try {
      const { data, error } = await supabase.functions.invoke('market-transactions', {
        body: { action: 'buy_listed', player_id: player.id, franchise_id: franchise.id }
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      alert('Transfer başarılı!')
      fetchMarketData()
      window.location.reload()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleTradeAction = async (offerId: string, action: 'accept' | 'reject' | 'cancel') => {
    try {
      const { data, error } = await supabase.functions.invoke('process-trade', {
        body: { action, offer_id: offerId, league_id: league!.id }
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      alert('İşlem başarılı!')
      fetchMarketData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <div className="space-y-4 pt-4 max-w-5xl mx-auto pb-20">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 bg-[#00152b]/80 p-6 rounded-xl border border-[#005c99]/30">
        <div className="flex items-center gap-4">
          <div className="bg-accent/20 p-3 rounded-full border border-accent/30">
            <ShoppingCart className="h-8 w-8 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-black text-white tracking-wider">TRANSFER MERKEZİ</h1>
            <p className="text-white/60 text-sm font-bold uppercase">Kadro mühendisliği</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-white/50 uppercase">Maaş Bütçesi</div>
          <div className="text-3xl font-black text-emerald-400 font-mono">
            ${((franchise?.budget || 0) / 1000000).toFixed(1)}M
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-[#001021] p-2 rounded-xl border border-[#005c99]/50 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('fa')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold uppercase tracking-wider text-sm transition-all whitespace-nowrap ${activeTab === 'fa' ? 'bg-[#004b93] text-white shadow-lg shadow-blue-900/20' : 'text-white/50 hover:bg-white/5'}`}
        >
          <UserCheck className="w-4 h-4" /> Serbest Oyuncular
        </button>
        <button 
          onClick={() => setActiveTab('transfer')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold uppercase tracking-wider text-sm transition-all whitespace-nowrap ${activeTab === 'transfer' ? 'bg-[#004b93] text-white shadow-lg shadow-blue-900/20' : 'text-white/50 hover:bg-white/5'}`}
        >
          <List className="w-4 h-4" /> Transfer Listesi
        </button>
        <button 
          onClick={() => setActiveTab('trades')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold uppercase tracking-wider text-sm transition-all whitespace-nowrap ${activeTab === 'trades' ? 'bg-[#004b93] text-white shadow-lg shadow-blue-900/20' : 'text-white/50 hover:bg-white/5'}`}
        >
          <ArrowLeftRight className="w-4 h-4" /> Takas Teklifleri
        </button>
      </div>

      {/* Content */}
      <div className="bg-[#00152b] border border-[#005c99]/30 rounded-xl p-6 min-h-[500px]">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full bg-white/5" />
            <Skeleton className="h-20 w-full bg-white/5" />
            <Skeleton className="h-20 w-full bg-white/5" />
          </div>
        ) : (
          <>
            {/* FREE AGENTS TAB */}
            {activeTab === 'fa' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {freeAgents.length === 0 && <div className="col-span-2 text-center text-white/50 py-10">Havuzda oyuncu bulunamadı.</div>}
                {freeAgents.map(player => (
                  <div key={player.id} className="bg-[#001021] border border-white/10 p-4 rounded-xl flex items-center justify-between hover:border-accent/50 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center font-display font-black text-xl text-white">
                        {player.overall}
                      </div>
                      <div>
                        <div className="font-bold text-white text-lg">{player.name}</div>
                        <div className="text-xs text-accent font-bold uppercase">{player.position}</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="font-mono font-bold text-emerald-400">${(player.value / 1000000).toFixed(1)}M</div>
                      <button 
                        onClick={() => handleBuyFA(player)}
                        disabled={!franchise || franchise.budget < player.value}
                        className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white text-xs font-bold uppercase px-4 py-2 rounded-lg transition-colors"
                      >
                        Sözleşme İmzala
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TRANSFER LIST TAB */}
            {activeTab === 'transfer' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {listedPlayers.length === 0 && <div className="col-span-2 text-center text-white/50 py-10">Transfer listesinde oyuncu yok.</div>}
                {listedPlayers.map(player => (
                  <div key={player.id} className="bg-[#001021] border border-[#005c99] p-4 rounded-xl flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-900/50 border border-blue-500/50 rounded-lg flex items-center justify-center font-display font-black text-xl text-white">
                        {player.overall}
                      </div>
                      <div>
                        <div className="font-bold text-white text-lg">{player.name}</div>
                        <div className="text-xs text-white/50 font-bold uppercase mb-1">{(player as any).franchises?.team_name}</div>
                        <div className="text-xs text-accent font-bold uppercase inline-block bg-accent/10 px-2 py-0.5 rounded">{player.position}</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="font-mono font-black text-emerald-400 text-xl">${((player.listed_price || 0) / 1000000).toFixed(1)}M</div>
                      {player.franchise_id === franchise?.id ? (
                        <div className="text-xs text-amber-500 font-bold uppercase px-2 py-1 bg-amber-500/10 rounded">Sizin Oyuncunuz</div>
                      ) : (
                        <button 
                          onClick={() => handleBuyListed(player)}
                          disabled={!franchise || franchise.budget < (player.listed_price || 0)}
                          className="bg-accent hover:bg-yellow-400 text-black text-xs font-black uppercase px-4 py-2 rounded-lg transition-colors"
                        >
                          Satın Al
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TRADES TAB */}
            {activeTab === 'trades' && (
              <div className="space-y-4">
                {tradeOffers.length === 0 && <div className="text-center text-white/50 py-10">Aktif takas teklifi bulunmuyor. Takas teklif etmek için Roster menüsünden başka takımların oyuncularını seçebilirsin.</div>}
                {tradeOffers.map(offer => {
                  const isSender = offer.sender_franchise_id === franchise?.id
                  const isReceiver = offer.receiver_franchise_id === franchise?.id
                  
                  if (!isSender && !isReceiver) return null

                  return (
                    <div key={offer.id} className="bg-[#001021] border border-[#005c99] p-6 rounded-xl">
                      <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-4">
                        <div className="text-sm font-bold text-white/50 uppercase">
                          {isSender ? 'Gönderdiğiniz Teklif' : 'Gelen Teklif'}
                        </div>
                        <div className="text-xs font-bold text-accent uppercase bg-accent/10 px-3 py-1 rounded-full">
                          Durum: {offer.status}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-8">
                        <div className="flex-1 text-center">
                          <div className="text-xs text-white/50 font-bold uppercase mb-2">{(offer as any).sender?.team_name} (Verilenler)</div>
                          <div className="bg-white/5 rounded-lg p-3 space-y-2">
                            {offer.offered_coins > 0 && <div className="text-emerald-400 font-bold font-mono">+ ${(offer.offered_coins / 1000000).toFixed(1)}M</div>}
                            {offer.offered_player_ids.length > 0 ? (
                              <div className="text-white text-sm">{offer.offered_player_ids.length} Oyuncu</div>
                            ) : (
                              offer.offered_coins === 0 && <div className="text-white/30 text-xs">Yok</div>
                            )}
                          </div>
                        </div>

                        <ArrowLeftRight className="w-8 h-8 text-white/20" />

                        <div className="flex-1 text-center">
                          <div className="text-xs text-white/50 font-bold uppercase mb-2">{(offer as any).receiver?.team_name} (İstenenler)</div>
                          <div className="bg-white/5 rounded-lg p-3 space-y-2">
                            {offer.requested_player_ids.length > 0 ? (
                              <div className="text-white text-sm">{offer.requested_player_ids.length} Oyuncu</div>
                            ) : (
                              <div className="text-white/30 text-xs">Yok</div>
                            )}
                          </div>
                        </div>
                      </div>

                      {offer.status === 'pending' && (
                        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-white/10">
                          {isReceiver && (
                            <>
                              <button onClick={() => handleTradeAction(offer.id, 'reject')} className="bg-red-500/10 text-red-400 hover:bg-red-500/20 px-6 py-2 rounded-lg font-bold text-sm uppercase transition-colors">Reddet</button>
                              <button onClick={() => handleTradeAction(offer.id, 'accept')} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-bold text-sm uppercase transition-colors">Kabul Et</button>
                            </>
                          )}
                          {isSender && (
                            <button onClick={() => handleTradeAction(offer.id, 'cancel')} className="bg-red-500/10 text-red-400 hover:bg-red-500/20 px-6 py-2 rounded-lg font-bold text-sm uppercase transition-colors">Teklifi İptal Et</button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

    </div>
  )
}
