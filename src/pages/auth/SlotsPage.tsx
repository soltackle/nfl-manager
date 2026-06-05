import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFranchiseStore } from '@/store/franchiseStore'
import { useAuthStore } from '@/store/authStore'
import { LogOut, Plus, Shield, ShieldQuestion } from 'lucide-react'

export function SlotsPage() {
  const { user, signOut } = useAuthStore()
  const { franchises, setActiveFranchise, activeFranchiseId } = useFranchiseStore()
  const navigate = useNavigate()

  useEffect(() => {
    // If we land here, we explicitly clear the active franchise
    // We only want to do this ONCE on mount, not when activeFranchiseId changes during navigation!
    setActiveFranchise(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSelectFranchise = async (id: string) => {
    await setActiveFranchise(id)
    navigate('/dashboard')
  }

  const handleNewCareer = () => {
    // Check if user has any franchise in waiting/draft status
    const hasPendingDraft = franchises.some((f: any) => 
      f.leagues?.status === 'waiting' || f.leagues?.status === 'draft'
    )
    
    if (hasPendingDraft) {
      return alert('Mevcut kariyerlerinizden biri henüz Kurulum/Bekleme aşamasını tamamlamadı. Yeni bir lige katılmadan önce lütfen onun bitmesini bekleyin.')
    }

    navigate('/setup')
  }

  // OSM has 4 slots
  const SLOTS = 4
  const slotsData = []
  for (let i = 0; i < SLOTS; i++) {
    slotsData.push(franchises[i] || null)
  }

  return (
    <div className="min-h-screen bg-[#001021] text-white p-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#00a2ff] blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600 blur-[120px] rounded-full"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-2 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
              <img src="/logo.svg" alt="Logo" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.src = 'https://api.dicebear.com/7.x/shapes/svg?seed=nfl' }} />
            </div>
            <div>
              <h1 className="text-2xl font-display font-black tracking-widest text-white uppercase">NFL MANAGER</h1>
              <p className="text-accent text-xs font-bold uppercase">Hoş Geldin, {user?.user_metadata?.username || 'Menajer'}</p>
            </div>
          </div>
          
          <button onClick={() => signOut()} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded transition-colors font-bold text-sm">
            <LogOut className="w-4 h-4" />
            Çıkış Yap
          </button>
        </div>

        <h2 className="text-xl font-display font-bold uppercase tracking-wider mb-6 text-white/80">KARİYER SLOTLARINIZ</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {slotsData.map((franchise, index) => {
            const isLocked = index > 1 && !franchise // Just a mock lock logic (Slot 3 and 4 locked unless you have them)
            
            if (franchise) {
              return (
                <div 
                  key={index} 
                  onClick={() => handleSelectFranchise(franchise.id)}
                  className="group relative bg-gradient-to-br from-[#00254c] to-[#00152b] border border-[#005c99] rounded-2xl p-6 cursor-pointer hover:border-accent hover:shadow-[0_0_30px_rgba(255,156,0,0.2)] transition-all overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl group-hover:bg-accent/20 transition-all"></div>
                  
                  <div className="relative z-10 flex items-start gap-4">
                    <Shield className="w-16 h-16 text-accent drop-shadow-md" fill="currentColor" />
                    <div>
                      <div className="text-[10px] font-bold uppercase text-accent mb-1 tracking-wider">Slot {index + 1}</div>
                      <h3 className="font-display font-black text-2xl uppercase tracking-wide">{franchise.team_name}</h3>
                      <p className="text-white/60 text-sm font-bold uppercase flex items-center gap-2">
                        <span>Bütçe: ${(franchise.club_fund / 1000000).toFixed(1)}M</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="relative z-10 mt-6 pt-4 border-t border-white/10 flex justify-between items-center">
                    <span className="text-sm font-bold text-green-400">AKTİF</span>
                    <span className="text-xs bg-white/10 px-3 py-1 rounded text-white font-bold uppercase">Yönet</span>
                  </div>
                </div>
              )
            }

            if (isLocked) {
              const cost = index === 2 ? 1000 : 2000
              return (
                <div key={index} className="bg-[#001021]/50 border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center opacity-70">
                  <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center mb-4 border border-white/10">
                    <ShieldQuestion className="w-8 h-8 text-white/30" />
                  </div>
                  <div className="text-[10px] font-bold uppercase text-white/50 mb-1 tracking-wider">Slot {index + 1}</div>
                  <h3 className="font-display font-black text-xl uppercase tracking-wide text-white/30 mb-2">KİLİTLİ</h3>
                  <button className="flex items-center gap-2 mt-4 px-4 py-2 bg-[#00254c] hover:bg-[#003366] text-white rounded font-bold text-xs uppercase transition-colors">
                    <span className="text-yellow-400">🪙 {cost}</span> İLE AÇ
                  </button>
                </div>
              )
            }

            return (
              <div 
                key={index} 
                onClick={handleNewCareer}
                className="group border-2 border-dashed border-[#005c99]/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-accent hover:bg-accent/5 transition-all"
              >
                <div className="w-16 h-16 bg-[#00152b] rounded-full flex items-center justify-center mb-4 group-hover:bg-accent group-hover:text-[#001021] text-accent transition-colors">
                  <Plus className="w-8 h-8" />
                </div>
                <div className="text-[10px] font-bold uppercase text-white/50 mb-1 tracking-wider">Slot {index + 1}</div>
                <h3 className="font-display font-black text-xl uppercase tracking-wide text-white">YENİ KARİYER</h3>
                <p className="text-white/40 text-xs font-bold uppercase mt-2">BİR LİGE KATIL VEYA YENİ LİG KUR</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
