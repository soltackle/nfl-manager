import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { CheckCircle, Circle, Coins, Gift, Zap } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

interface QuestsModalProps {
  onClose: () => void
}

export function QuestsModal({ onClose }: QuestsModalProps) {
  const { user } = useAuthStore()
  const [quests, setQuests] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState<string | null>(null)

  const fetchQuests = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-quests')
      if (!error && data?.quests) {
        setQuests(data.quests)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuests()
  }, [])

  const handleClaim = async (type: string) => {
    if (!user) return
    setClaiming(type)
    try {
      const { data, error } = await supabase.functions.invoke('claim-quest', {
        body: { questType: type }
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      
      // Update local authStore coin balance
      useAuthStore.setState((state) => ({
        profile: state.profile ? { ...state.profile, amfutcoin: (state.profile.amfutcoin || 0) + data.reward } : null
      }))
      
      // Refetch quests
      await fetchQuests()
    } catch (err: unknown) {
      alert((err instanceof Error ? err.message : String(err)))
    } finally {
      setClaiming(null)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="text-white">Yükleniyor...</div>
      </div>
    )
  }

  const tasks = [
    {
      id: 'login',
      title: 'Oyuna Giriş Yap',
      desc: 'Her gün oyuna girerek takımını takip et.',
      reward: 2,
      progress: 1,
      total: 1,
      claimed: quests?.login_claimed
    },
    {
      id: 'friendly',
      title: '1 Dostluk Maçı Yap',
      desc: 'Ligdeki bir takımla antrenman maçı yap.',
      reward: 3,
      progress: Math.min(quests?.friendly_played || 0, 1),
      total: 1,
      claimed: quests?.friendly_claimed
    },
    {
      id: 'shop',
      title: 'Mağazadan Alışveriş Yap',
      desc: 'Takımını güçlendirmek için mağazayı kullan.',
      reward: 2,
      progress: Math.min(quests?.shop_bought || 0, 1),
      total: 1,
      claimed: quests?.shop_claimed
    }
  ]

  const completedCount = tasks.filter(t => t.progress >= t.total).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gradient-to-b from-[#001f40] to-[#001021] border-2 border-accent rounded-2xl w-full max-w-md shadow-[0_0_50px_rgba(255,156,0,0.2)] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-display font-black text-white uppercase tracking-widest flex items-center gap-2">
              <Gift className="text-accent" /> Günlük Görevler
            </h2>
            <p className="text-white/50 text-xs mt-1">Görevler her gece 00:00'da sıfırlanır.</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition p-1">
            <span className="sr-only">Kapat</span>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Progress Overview */}
        <div className="px-6 py-4 bg-black/20 border-b border-white/5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-white uppercase">İlerleme</span>
            <span className="text-sm font-bold text-accent">{completedCount} / 3</span>
          </div>
          <div className="w-full bg-[#00152b] rounded-full h-2">
            <div className="bg-accent h-2 rounded-full transition-all" style={{ width: `${(completedCount / 3) * 100}%` }}></div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {tasks.map(task => {
            const isCompleted = task.progress >= task.total
            return (
              <div key={task.id} className={`bg-[#00152b] border rounded-xl p-4 transition-colors ${task.claimed ? 'border-green-500/30 opacity-60' : isCompleted ? 'border-accent' : 'border-[#004b93]'}`}>
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <div className="mt-1">
                      {task.claimed ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-accent" />
                      ) : (
                        <Circle className="w-5 h-5 text-white/20" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm uppercase">{task.title}</div>
                      <div className="text-xs text-white/50 mt-1">{task.desc}</div>
                      
                      {/* Progress Text */}
                      {!task.claimed && (
                        <div className="text-[10px] font-bold mt-2 text-white/40">
                          {task.progress} / {task.total}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between h-full">
                    <div className="flex items-center gap-1 bg-[#00254c] px-2 py-1 rounded text-xs font-bold text-yellow-400 mb-2">
                      <Coins className="w-3 h-3" /> {task.reward}
                    </div>
                    
                    {!task.claimed && isCompleted && (
                      <button 
                        onClick={() => handleClaim(task.id)}
                        disabled={claiming === task.id}
                        className="bg-accent text-[#001021] text-xs font-bold px-3 py-1.5 rounded uppercase hover:bg-white transition"
                      >
                        {claiming === task.id ? '...' : 'Ödülü Al'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}
