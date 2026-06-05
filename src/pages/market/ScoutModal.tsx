import { useState, useEffect } from 'react'
import { X, Search, Clock, CheckCircle2, Coins } from 'lucide-react'
import { useScout } from '@/hooks/useScout'
import { useAuthStore } from '@/store/authStore'

export function ScoutModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { mission, isLoading, startScout, claimScout } = useScout()
  const { user } = useAuthStore()
  
  const [selectedPos, setSelectedPos] = useState('QB')
  const [isProcessing, setIsProcessing] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  const positions = ['QB', 'RB', 'WR', 'TE', 'OL', 'DE', 'LB', 'CB', 'S', 'K', 'P']

  useEffect(() => {
    if (!mission) return
    if (mission.status === 'searching') {
      const interval = setInterval(() => {
        const end = new Date(mission.end_time).getTime()
        const now = new Date().getTime()
        const diff = end - now
        if (diff <= 0) {
          setTimeLeft(0)
          clearInterval(interval)
        } else {
          setTimeLeft(Math.floor(diff / 1000))
        }
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [mission])

  if (!isOpen) return null

  const handleStart = async () => {
    if ((user?.amfutcoin || 0) < 100) return alert('Yetersiz Amfutcoin!')
    setIsProcessing(true)
    try {
      await startScout(selectedPos)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClaim = async () => {
    setIsProcessing(true)
    try {
      await claimScout()
      alert('Yıldız oyuncu kadroya eklendi!')
      onClose()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-gradient-to-br from-[#002040] to-[#001021] w-full max-w-md rounded-2xl border-2 border-accent shadow-[0_0_40px_rgba(255,156,0,0.2)] overflow-hidden">
        
        <div className="flex items-center justify-between p-4 bg-black/20 border-b border-accent/20">
          <div className="flex items-center gap-2 text-accent font-display font-bold text-lg">
            <Search className="w-5 h-5" />
            ÖZEL YETENEK AVCISI
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {isLoading ? (
            <div className="text-center text-white/50 animate-pulse py-8">Yükleniyor...</div>
          ) : mission ? (
            // Active or Claimed Mission
            mission.status === 'claimed' ? (
              <div className="text-center py-8 space-y-4">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
                <h3 className="text-xl font-bold text-white">Görev Tamamlandı</h3>
                <p className="text-white/60 text-sm">Bugünlük scout hakkınızı kullandınız. Yeni bir yetenek avı için yarın tekrar gelin.</p>
              </div>
            ) : timeLeft !== null && timeLeft > 0 ? (
              <div className="text-center py-8 space-y-4">
                <Clock className="w-16 h-16 text-accent mx-auto animate-pulse" />
                <h3 className="text-xl font-bold text-white">Oyuncu Aranıyor...</h3>
                <p className="text-white/60 text-sm">Gözlemcilerimiz {mission.position} mevkisinde bir yıldız bulmak için çalışıyor.</p>
                <div className="text-4xl font-display font-black text-white bg-black/30 py-4 rounded-xl border border-white/10">
                  {formatTime(timeLeft)}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 space-y-4">
                <CheckCircle2 className="w-16 h-16 text-accent mx-auto" />
                <h3 className="text-xl font-bold text-white">Yıldız Oyuncu Bulundu!</h3>
                <p className="text-white/60 text-sm">Gözlemcilerimiz {mission.position} mevkisinde 80-95 OVR arası potansiyelli bir oyuncu keşfetti.</p>
                <button 
                  onClick={handleClaim}
                  disabled={isProcessing}
                  className="w-full py-4 mt-4 bg-accent text-[#001021] font-bold text-lg rounded-xl shadow-lg hover:bg-yellow-400 disabled:opacity-50 transition-all uppercase"
                >
                  {isProcessing ? 'Alınıyor...' : 'Sözleşme İmzala (Kadroya Kat)'}
                </button>
              </div>
            )
          ) : (
            // No Mission Today - Start Menu
            <div className="space-y-6">
              <p className="text-white/70 text-sm text-center">
                100 Amfutcoin karşılığında istediğin mevkide elit bir yıldız oyuncu (80-95 OVR) bulması için gözlemci gönderebilirsin. Günde 1 kez kullanılabilir!
              </p>
              
              <div>
                <label className="block text-white/50 text-xs font-bold uppercase mb-2">Aranacak Mevki</label>
                <div className="grid grid-cols-4 gap-2">
                  {positions.map(p => (
                    <button
                      key={p}
                      onClick={() => setSelectedPos(p)}
                      className={`py-2 text-sm font-bold rounded-lg border transition-all ${
                        selectedPos === p 
                          ? 'bg-accent text-[#001021] border-accent shadow-[0_0_10px_rgba(255,156,0,0.5)]' 
                          : 'bg-black/20 text-white/60 border-white/10 hover:border-white/30'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleStart}
                disabled={isProcessing}
                className="w-full flex flex-col items-center justify-center py-3 bg-accent text-[#001021] rounded-xl hover:bg-yellow-400 disabled:opacity-50 transition-all font-bold shadow-[0_0_15px_rgba(255,156,0,0.3)]"
              >
                <span className="text-lg uppercase">Gözlemci Gönder</span>
                <span className="flex items-center gap-1 text-sm opacity-80">
                  <Coins className="w-4 h-4" /> 100 Amfutcoin
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
