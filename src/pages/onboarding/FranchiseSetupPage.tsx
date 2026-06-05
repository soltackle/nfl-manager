import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useFranchiseStore } from '@/store/franchiseStore'
import { supabase } from '@/lib/supabase'

const LOGOS = ['🐻 Ayı', '🐺 Kurt', '🦅 Kartal', '🦁 Aslan', '🦅 Şahin', '🐂 Boğa', '🐍 Yılan', '🦈 Köpekbalığı']
const COLORS = ['🔴⚪', '🔵🟡', '🟢⚫', '🟣🟡', '🔵⚪', '🟠⚫', '🟡🔵', '🟢🟡', '🔴⚫', '⚪🔵', '🟤🟡', '⚫🟡']

export function FranchiseSetupPage() {
  const { user } = useAuthStore()
  const { setActiveFranchise } = useFranchiseStore()
  const navigate = useNavigate()

  const [city, setCity] = useState('İstanbul')
  const [teamName, setTeamName] = useState('')
  const [selectedColor, setSelectedColor] = useState(COLORS[0])
  const [selectedLogo, setSelectedLogo] = useState(LOGOS[0])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSetup = async () => {
    if (!teamName) return
    setIsSubmitting(true)
    
    try {
      const { data, error } = await supabase.functions.invoke('auto-matchmake', {
        body: { team_name: teamName, city }
      })

      if (error) throw error
      if (data?.error) throw new Error(data.error)

      // Set the newly created franchise as active
      await setActiveFranchise(data.franchise.id)
      
      navigate('/lobby')
    } catch (err: any) {
      alert('Kurulum hatası: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#001021] text-white flex items-center justify-center p-6 relative overflow-hidden">
      <div className="max-w-2xl w-full bg-[#00152b] border border-[#005c99] rounded-xl p-8 relative z-10 shadow-2xl">
        <h1 className="text-2xl font-display font-black tracking-widest text-white uppercase text-center mb-2">
          🏈 FRANCHISE KURULUMU
        </h1>
        <p className="text-accent text-center font-bold uppercase text-sm mb-8">
          Takımını Yönetmeye Başlamadan Önce Kimliğini Belirle. Ardından Otomatik Olarak Bir Lige Atanacaksın.
        </p>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-white/50 mb-2">Şehir</label>
              <select 
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full bg-[#001021] border border-[#004b93] rounded p-4 text-white font-bold uppercase focus:border-accent outline-none"
              >
                <option>İstanbul</option>
                <option>Ankara</option>
                <option>İzmir</option>
                <option>Bursa</option>
                <option>Antalya</option>
                <option>Adana</option>
                <option>Trabzon</option>
                <option>Gaziantep</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-white/50 mb-2">Takım İsmi</label>
              <input 
                type="text"
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                placeholder="Örn: Bears"
                maxLength={20}
                className="w-full bg-[#001021] border border-[#004b93] rounded p-4 text-white font-bold uppercase focus:border-accent outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-white/50 mb-2">Takım Renkleri</label>
            <div className="grid grid-cols-6 gap-2">
              {COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`py-3 rounded border transition-all ${selectedColor === color ? 'border-accent bg-accent/10' : 'border-[#004b93] hover:border-white/30'}`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-white/50 mb-2">Logo</label>
            <div className="grid grid-cols-4 gap-2">
              {LOGOS.map(logo => (
                <button
                  key={logo}
                  onClick={() => setSelectedLogo(logo)}
                  className={`py-3 rounded border text-sm font-bold transition-all ${selectedLogo === logo ? 'border-accent bg-accent/10 text-accent' : 'border-[#004b93] text-white/70 hover:border-white/30 hover:text-white'}`}
                >
                  {logo}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-6">
            <button
              onClick={handleSetup}
              disabled={!teamName || isSubmitting}
              className="w-full py-4 bg-accent text-[#001021] font-display font-black text-xl uppercase tracking-widest rounded hover:bg-white hover:text-[#001021] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'KAYDEDİLİYOR...' : '✅ KURULUMU TAMAMLA'}
            </button>
            <p className="text-center text-[10px] text-white/40 font-bold uppercase mt-3">
              Kurulum tamamlandıktan sonra sezon boyunca isim değiştirilemez.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
