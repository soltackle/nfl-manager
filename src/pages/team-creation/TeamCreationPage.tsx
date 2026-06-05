import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import type { Player, Franchise } from '../../types'
import { Layout } from '../../components/layout/Layout'
import { motion, AnimatePresence } from 'framer-motion'
import { DollarSign, ShieldAlert, CheckCircle2, UserPlus, Info } from 'lucide-react'

const REQUIRED_POSITIONS = {
  QB: 1, RB: 1, WR: 2, TE: 1, OL: 1, DL: 1, LB: 1, CB: 1, S: 1, K: 1
}

export function TeamCreationPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [franchise, setFranchise] = useState<Franchise | null>(null)
  const [poolPlayers, setPoolPlayers] = useState<Player[]>([])
  const [cart, setCart] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    fetchData()
  }, [user])

  const fetchData = async () => {
    try {
      // 1. Get Franchise
      const { data: franchises, error: fErr } = await supabase
        .from('franchises')
        .select('*')
        .eq('user_id', user!.id)
      
      if (fErr || !franchises || franchises.length === 0) {
        navigate('/')
        return
      }

      const activeFranchise = franchises[0] // Simplify for now
      setFranchise(activeFranchise)

      // 2. Get Personal Pool Players
      const { data: players, error: pErr } = await supabase
        .from('players')
        .select('*')
        .eq('target_user_id', user!.id)
        .eq('status', 'personal_pool')
        .order('overall', { ascending: false })

      if (pErr) throw pErr
      
      setPoolPlayers(players || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const addToCart = (player: Player) => {
    if (cart.length >= 11) {
      alert('En fazla 11 oyuncu seçebilirsin.')
      return
    }
    
    // Check budget
    const currentCost = cart.reduce((sum, p) => sum + p.value, 0)
    if (franchise && currentCost + player.value > franchise.budget) {
      alert('Bütçen yetersiz!')
      return
    }

    setCart(prev => [...prev, player])
    setPoolPlayers(prev => prev.filter(p => p.id !== player.id))
  }

  const removeFromCart = (player: Player) => {
    setPoolPlayers(prev => [...prev, player].sort((a,b) => b.overall - a.overall))
    setCart(prev => prev.filter(p => p.id !== player.id))
  }

  const getPositionCounts = () => {
    const counts: Record<string, number> = { QB: 0, RB: 0, WR: 0, TE: 0, OL: 0, DL: 0, LB: 0, CB: 0, S: 0, K: 0 }
    cart.forEach(p => {
      if (p.position === 'DE') counts['DL']++
      else if (counts[p.position] !== undefined) counts[p.position]++
    })
    return counts
  }

  const getValidationErrors = () => {
    const counts = getPositionCounts()
    const errors: string[] = []
    
    Object.entries(REQUIRED_POSITIONS).forEach(([pos, required]) => {
      if (counts[pos] !== required) {
        errors.push(`Tam olarak ${required} ${pos} seçmelisin. (Şu an: ${counts[pos]})`)
      }
    })
    
    return errors
  }

  const handleSubmit = async () => {
    if (!franchise) return
    const errors = getValidationErrors()
    if (errors.length > 0) {
      alert("Kadro kurallarına uymalısın:\n" + errors.join('\n'))
      return
    }

    setSubmitting(true)
    try {
      const { data, error } = await supabase.functions.invoke('finalize-team', {
        body: {
          league_id: franchise.league_id,
          franchise_id: franchise.id,
          selected_player_ids: cart.map(p => p.id)
        }
      })

      if (error) throw new Error(error.message)
      if (data?.error) throw new Error(data.error)

      navigate(`/league/${franchise.league_id}`)
    } catch (err: any) {
      alert(err.message)
      setSubmitting(false)
    }
  }

  if (loading) return <Layout><div className="p-8 text-center">Yükleniyor...</div></Layout>
  if (!franchise) return null

  const totalCost = cart.reduce((sum, p) => sum + p.value, 0)
  const remainingBudget = franchise.budget - totalCost
  const counts = getPositionCounts()
  const validationErrors = getValidationErrors()

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        
        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-700 mb-8 backdrop-blur-md">
          <h1 className="text-3xl font-black text-white mb-2">Başlangıç Kadronu Kur</h1>
          <p className="text-slate-400">
            Sana özel hazırlanan bu oyuncu havuzundan 11 kişilik ana kadronu oluştur. 
            Maaş bütçeni aşmamaya dikkat et. Seçimini yaptıktan sonra lig maceran başlayacak!
          </p>
          <div className="mt-4 flex gap-6">
            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
              <div className="text-sm text-slate-400 mb-1">Maaş Bütçesi</div>
              <div className="text-2xl font-bold text-emerald-400 flex items-center gap-1">
                <DollarSign className="w-5 h-5" />
                {(franchise.budget / 1000000).toFixed(1)}M
              </div>
            </div>
            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
              <div className="text-sm text-slate-400 mb-1">Kalan Bütçe</div>
              <div className="text-2xl font-bold text-white flex items-center gap-1">
                <DollarSign className="w-5 h-5 text-slate-400" />
                {(remainingBudget / 1000000).toFixed(1)}M
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Market (Pool) */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-400" />
              Sana Özel Oyuncu Havuzu
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              <AnimatePresence>
                {poolPlayers.map((player) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-slate-800 border border-slate-700 p-4 rounded-xl hover:border-indigo-500/50 transition-colors cursor-pointer group"
                    onClick={() => addToCart(player)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-bold text-white text-lg">{player.name}</div>
                        <div className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 inline-block px-2 py-1 rounded">
                          {player.position}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-white">{player.overall}</div>
                        <div className="text-xs text-slate-400">OVR</div>
                      </div>
                    </div>
                    
                    {player.traits && player.traits.length > 0 && (
                      <div className="flex flex-wrap gap-1 my-2">
                        {player.traits.map((t: string) => (
                          <span key={t} className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-3 flex justify-between items-center">
                      <div className="text-emerald-400 font-medium">
                        ${(player.value / 1000000).toFixed(1)}M
                      </div>
                      <button className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        Sepete Ekle
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Cart */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 sticky top-8">
              <h2 className="text-xl font-bold text-white mb-4">Kadro Sepeti ({cart.length}/11)</h2>
              
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(REQUIRED_POSITIONS).map(([pos, req]) => {
                    const count = counts[pos]
                    const isOk = count === req
                    return (
                      <div key={pos} className={`flex justify-between p-2 rounded ${isOk ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-900/50 text-slate-400'}`}>
                        <span>{pos}</span>
                        <span>{count}/{req}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2 mb-6 max-h-[300px] overflow-y-auto custom-scrollbar">
                <AnimatePresence>
                  {cart.map(player => (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex items-center justify-between p-2 bg-slate-900 rounded border border-slate-700 group"
                    >
                      <div>
                        <div className="text-sm font-bold text-white">{player.name}</div>
                        <div className="text-xs text-slate-400">{player.position} | {player.overall} OVR</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-sm text-emerald-400">${(player.value / 1000000).toFixed(1)}M</div>
                        <button 
                          onClick={() => removeFromCart(player)}
                          className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          X
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {validationErrors.length > 0 && cart.length > 0 && (
                <div className="mb-6 bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex items-start gap-2 text-sm text-red-400">
                  <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    {validationErrors.map((err, i) => (
                      <div key={i}>{err}</div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting || validationErrors.length > 0 || cart.length !== 11}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? 'Onaylanıyor...' : 'Takımı Onayla ve Lige Başla'}
                {!submitting && cart.length === 11 && validationErrors.length === 0 && <CheckCircle2 className="w-5 h-5" />}
              </button>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  )
}
