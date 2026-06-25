import { useEffect, useState } from 'react'
import { useFranchiseStore } from '@/store/franchiseStore'
import { supabase } from '@/lib/supabase'
import { Coins, Zap, TrendingUp, AlertCircle, CheckCircle, Shield } from 'lucide-react'

export function ShopPage() {
  const { franchise, league } = useFranchiseStore()
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [players, setPlayers] = useState<unknown[]>([])
  const [selectedPlayer, setSelectedPlayer] = useState<string>('')
  
  const [purchasing, setPurchasing] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })

  useEffect(() => {
    if (!franchise) return
    const init = async () => {
      // 1. Get Balance
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: u } = await supabase.from('users').select('amfutcoin').eq('id', user.id).single()
        if (u) setBalance(u.amfutcoin || 0)
      }

      // 2. Get Roster
      const { data: roster } = await supabase.from('players').select('id, name, overall, position').eq('franchise_id', franchise.id).order('overall', { ascending: false })
      if (roster) {
        setPlayers(roster)
        if (roster.length > 0) setSelectedPlayer(roster[0].id)
      }
      setLoading(false)
    }
    init()
  }, [franchise])

  const handlePurchase = async (type: 'boost' | 'develop') => {
    const cost = type === 'boost' ? 15 : 20
    if (balance < cost) {
      setMsg({ type: 'error', text: 'Yetersiz AmFutCoin!' })
      return
    }

    if (type === 'develop' && !selectedPlayer) {
      setMsg({ type: 'error', text: 'Lütfen geliştirilecek bir oyuncu seçin.' })
      return
    }

    setPurchasing(true)
    setMsg({ type: '', text: '' })

    try {
      const { data, error } = await supabase.functions.invoke('shop-purchase', {
        body: { type, target_id: type === 'develop' ? selectedPlayer : franchise?.id, league_id: league?.id }
      })

      if (error) throw new Error(error.message)
      if (data?.error) throw new Error(data.error)

      setBalance(prev => prev - cost)
      setMsg({ type: 'success', text: data.message || 'Satın alım başarılı!' })

      // Update local roster if develop
      if (type === 'develop') {
        setPlayers(players.map(p => p.id === selectedPlayer ? { ...p, overall: p.overall + 1 } : p))
      }
    } catch (err: unknown) {
      setMsg({ type: 'error', text: (err instanceof Error ? err.message : String(err)) })
    } finally {
      setPurchasing(false)
    }
  }

  if (loading) return <div className="text-white text-center mt-10">Yükleniyor...</div>

  return (
    <div className="space-y-6 pt-4 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="bg-[#00152b] border border-[#005c99] rounded-xl p-6 shadow-xl flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-black text-white uppercase tracking-wider">MAĞAZA</h1>
          <p className="text-white/60 mt-1 text-sm">AmFutCoin kullanarak takımınızı güçlendirin.</p>
        </div>
        <div className="bg-[#00254c] border border-accent rounded-xl p-4 flex flex-col items-center min-w-[120px] shadow-[0_0_15px_rgba(255,156,0,0.2)]">
          <Coins className="w-8 h-8 text-accent mb-1" />
          <span className="text-2xl font-black text-white">{balance}</span>
          <span className="text-[10px] text-accent font-bold uppercase tracking-widest">AMFUTCOIN</span>
        </div>
      </div>

      {msg.text && (
        <div className={`border rounded p-4 flex items-center gap-2 ${msg.type === 'error' ? 'bg-red-500/20 border-red-500 text-red-200' : 'bg-green-500/20 border-green-500 text-green-200'}`}>
          {msg.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
          <span className="font-bold text-sm">{msg.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Item 1: Pre-match Boost */}
        <div className="bg-gradient-to-br from-[#003366] to-[#001f40] border border-[#004b93] rounded-xl p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-accent/20 p-3 rounded-full">
                <Zap className="w-8 h-8 text-accent" />
              </div>
              <div>
                <h3 className="text-white font-display font-black text-xl uppercase tracking-wider">Maç Öncesi Takviye</h3>
                <span className="text-accent text-xs font-bold uppercase tracking-widest">Sıradaki 1 Maç İçin</span>
              </div>
            </div>
            <p className="text-white/70 text-sm mb-6 leading-relaxed">
              Takımınızın moral ve kondisyonunu zirveye taşır. Sıradaki resmi lig maçınızda takımınızın genel gücüne <strong className="text-white">+5 OVR</strong> etki eder. Maç sonrası etkisi biter.
            </p>
          </div>
          <button 
            onClick={() => handlePurchase('boost')}
            disabled={purchasing || balance < 15}
            className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
              balance < 15 ? 'bg-red-500/20 text-red-400 border border-red-500 cursor-not-allowed' : 'bg-accent text-[#001021] hover:bg-white hover:shadow-[0_0_15px_rgba(255,156,0,0.4)]'
            }`}
          >
            {purchasing ? 'İşleniyor...' : <>Satın Al <Coins className="w-4 h-4 ml-1" /> 15</>}
          </button>
        </div>

        {/* Item 2: Player Dev */}
        <div className="bg-gradient-to-br from-green-900/60 to-[#001f40] border border-green-500/30 rounded-xl p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-500/20 p-3 rounded-full">
                <TrendingUp className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <h3 className="text-white font-display font-black text-xl uppercase tracking-wider">Özel Antrenör</h3>
                <span className="text-green-400 text-xs font-bold uppercase tracking-widest">Kalıcı Gelişim</span>
              </div>
            </div>
            <p className="text-white/70 text-sm mb-4 leading-relaxed">
              Seçtiğiniz bir oyuncuyu özel antrenör ile hemen kampa sokun. Oyuncunun Genel Gücü anında ve kalıcı olarak <strong className="text-green-400">+1 OVR</strong> artar.
            </p>
            
            <div className="mb-6">
              <label className="text-xs font-bold text-white/50 uppercase mb-2 block">Geliştirilecek Oyuncu</label>
              <select 
                value={selectedPlayer}
                onChange={(e) => setSelectedPlayer(e.target.value)}
                className="w-full bg-[#00152b] border border-[#005c99] rounded p-2 text-white font-bold text-sm focus:outline-none focus:border-accent"
              >
                {players.map(p => (
                  <option key={p.id} value={p.id}>{p.position} - {p.name} (OVR: {p.overall})</option>
                ))}
              </select>
            </div>
          </div>
          
          <button 
            onClick={() => handlePurchase('develop')}
            disabled={purchasing || balance < 20 || !selectedPlayer}
            className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
              balance < 20 ? 'bg-red-500/20 text-red-400 border border-red-500 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-400 hover:shadow-[0_0_15px_rgba(34,197,94,0.4)]'
            }`}
          >
            {purchasing ? 'İşleniyor...' : <>Geliştir <Coins className="w-4 h-4 ml-1" /> 20</>}
          </button>
        </div>

      </div>
    </div>
  )
}
