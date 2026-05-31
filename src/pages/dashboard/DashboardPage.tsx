import { useAuthStore } from '@/store/authStore'
import { useFranchiseStore } from '@/store/franchiseStore'
import { useMatch } from '@/hooks/useMatch'
import { Shield, CloudRain, Info, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function DashboardPage() {
  const { user } = useAuthStore()
  const { franchise } = useFranchiseStore()
  const { match, isLoading: isMatchLoading } = useMatch()
  const navigate = useNavigate()

  return (
    <div className="space-y-4 pt-4">
      
      {/* 1. OSM Style Match Banner */}
      <div className="relative w-full rounded-xl bg-gradient-to-b from-[#004b93]/90 to-[#001f40]/90 border border-[#005c99] shadow-2xl overflow-hidden p-6">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
        
        {/* Header */}
        <div className="relative z-10 flex flex-col items-center mb-6">
          <div className="bg-[#00254c] border-2 border-[#005c99] rounded px-4 py-1 mb-2 shadow-lg">
            <span className="text-white font-display font-bold uppercase tracking-widest text-sm">MAÇ GÜNÜ 6</span>
          </div>
          <span className="text-white font-bold text-sm tracking-wide">Sıradaki maç</span>
          <span className="text-white font-display font-bold text-3xl drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">06s 35d 31s</span>
        </div>

        {/* VS Section */}
        <div className="relative z-10 flex items-center justify-between max-w-2xl mx-auto px-4">
          
          {/* Home Team */}
          <div className="flex flex-col items-center w-1/3">
            <div className="relative">
              <Shield className="h-28 w-28 text-purple-600 drop-shadow-[0_0_15px_rgba(147,51,234,0.6)]" fill="currentColor" />
              <div className="absolute -bottom-2 -right-2 bg-[#00152b] rounded-full p-1 border border-gray-600">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=Eyupspor`} className="w-8 h-8 rounded-full" />
              </div>
            </div>
            <div className="text-white font-display font-bold text-lg mt-4 uppercase tracking-wide">EYÜPSPOR</div>
            <div className="flex gap-1 mt-2">
              <span className="w-4 h-4 rounded-full bg-red-600 text-[10px] flex items-center justify-center font-bold text-white shadow">M</span>
              <span className="w-4 h-4 rounded-full bg-red-600 text-[10px] flex items-center justify-center font-bold text-white shadow">M</span>
              <span className="w-4 h-4 rounded-full bg-gray-500 text-[10px] flex items-center justify-center font-bold text-white shadow">B</span>
              <span className="w-4 h-4 rounded-full bg-red-600 text-[10px] flex items-center justify-center font-bold text-white shadow">M</span>
            </div>
          </div>

          {/* VS */}
          <div className="flex flex-col items-center justify-center">
            <div className="text-6xl font-display font-black text-[#00152b] drop-shadow-[0_2px_4px_rgba(255,255,255,0.2)]" style={{ WebkitTextStroke: '2px #00a2ff' }}>VS</div>
            <div className="flex items-center gap-2 mt-8 bg-[#00152b]/50 px-3 py-1 rounded-full border border-white/10">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=referee`} className="w-6 h-6 rounded-full" />
              <CloudRain className="h-5 w-5 text-blue-300" />
            </div>
            <div className="text-center mt-2">
              <div className="text-white/60 text-xs uppercase tracking-wider font-bold">Hakem</div>
              <div className="text-white text-sm font-bold">Cihan Aydın</div>
            </div>
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center w-1/3">
            <div className="relative">
              <div className="absolute -top-4 -left-4 bg-[#00152b] rounded-full w-8 h-8 flex items-center justify-center border border-[#005c99] text-white font-bold text-xs shadow-lg">74</div>
              <Shield className="h-28 w-28 text-accent drop-shadow-[0_0_15px_rgba(255,156,0,0.6)]" fill="currentColor" />
              <div className="absolute -bottom-2 -right-2 bg-[#00152b] rounded-full p-1 border border-gray-600">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`} className="w-8 h-8 rounded-full" />
              </div>
            </div>
            <div className="text-white font-display font-bold text-lg mt-4 uppercase tracking-wide text-center">İSTANBUL BAŞAKŞEHİR</div>
            <div className="text-[#00a2ff] text-xs font-bold">🇹🇷 {user?.username}</div>
            <div className="flex gap-1 mt-2">
              <span className="w-4 h-4 rounded-full bg-green-500 text-[10px] flex items-center justify-center font-bold text-white shadow">G</span>
              <span className="w-4 h-4 rounded-full bg-green-500 text-[10px] flex items-center justify-center font-bold text-white shadow">G</span>
              <span className="w-4 h-4 rounded-full bg-gray-500 text-[10px] flex items-center justify-center font-bold text-white shadow">B</span>
              <span className="w-4 h-4 rounded-full bg-gray-500 text-[10px] flex items-center justify-center font-bold text-white shadow">B</span>
            </div>
          </div>

        </div>
      </div>

      {/* 2. OSM Quick Actions Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Antrenman */}
        <div className="bg-gradient-to-br from-[#003366] to-[#001f40] border border-[#004b93] rounded-xl p-4 flex items-center justify-between cursor-pointer hover:brightness-110 transition shadow-lg" onClick={() => navigate('/training')}>
          <div className="flex items-center gap-4">
            <img src="https://api.dicebear.com/7.x/shapes/svg?seed=cone&backgroundColor=00a2ff" className="w-12 h-12 rounded" />
            <div>
              <div className="text-accent text-xs font-bold uppercase tracking-wider mb-1">ANTRENMAN</div>
              <div className="text-white font-display font-bold text-lg uppercase">ANTRENÖR MÜSAİT</div>
            </div>
          </div>
          <ChevronRight className="text-white/50 w-6 h-6" />
        </div>

        {/* Maç Hazırlığı */}
        <div className="bg-gradient-to-br from-[#003366] to-[#001f40] border border-[#004b93] rounded-xl p-4 flex items-center justify-between cursor-pointer hover:brightness-110 transition shadow-lg" onClick={() => navigate('/roster')}>
          <div className="flex items-center gap-4">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=sad_player`} className="w-12 h-12 bg-white/10 rounded" />
            <div className="flex-1 w-full">
              <div className="text-accent text-xs font-bold uppercase tracking-wider mb-1">MAÇ HAZIRLIĞI</div>
              <div className="flex items-center gap-3">
                <div className="h-3 w-24 bg-red-900 rounded-full overflow-hidden border border-red-500">
                  <div className="h-full bg-red-500 w-1/4"></div>
                </div>
                <span className="text-white font-bold text-sm uppercase">KRİTİK</span>
              </div>
            </div>
          </div>
          <Info className="text-green-400 w-5 h-5 absolute top-2 right-2" />
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Promo / Shop Ad */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-800 rounded-xl p-4 flex flex-col justify-between cursor-pointer shadow-lg border border-purple-400/50">
          <div className="flex justify-between items-start">
            <div className="bg-white text-purple-800 font-black text-xl px-2 py-1 rounded shadow-lg italic">85+</div>
            <div className="bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-white">!</div>
          </div>
          <div className="mt-4">
            <div className="bg-black/30 text-white text-xs text-center font-bold py-1 rounded">0/3 GÖREV</div>
          </div>
        </div>

        {/* Dostluk Maçları */}
        <div className="bg-gradient-to-br from-[#003366] to-[#001f40] border border-[#004b93] rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:brightness-110 transition shadow-lg md:col-span-1">
          <div className="flex justify-center w-12">
            <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[20px] border-t-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]"></div>
          </div>
          <div>
            <div className="text-accent font-display font-bold text-lg uppercase tracking-wider">DOSTLUK MAÇLARI</div>
            <div className="text-white text-xs font-bold uppercase mt-1">LİGİNDEKİ DİĞER KULÜPLERE KARŞI DOSTLUK MAÇI OYNA</div>
          </div>
        </div>

        {/* Transfer Listesi */}
        <div className="bg-gradient-to-br from-[#003366] to-[#001f40] border border-[#004b93] rounded-xl p-4 flex items-center justify-between cursor-pointer hover:brightness-110 transition shadow-lg md:col-span-1" onClick={() => navigate('/market')}>
           <div className="flex items-center gap-4">
            <div className="bg-white rounded p-2 relative">
              <div className="w-6 h-6 border-2 border-gray-300"></div>
              <div className="absolute -top-1 -right-1 bg-red-500 w-4 h-4 rounded-full text-white flex items-center justify-center text-[10px] font-bold">1</div>
            </div>
            <div>
              <div className="text-[#00a2ff] font-display font-bold text-lg uppercase tracking-wider">TRANSFER LİSTESİ</div>
              <div className="text-white text-xs font-bold uppercase mt-1">ÖZEL TEKLİF VAR</div>
            </div>
          </div>
        </div>

      </div>

    </div>
  )
}
