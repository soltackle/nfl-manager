import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Lightbulb, X } from 'lucide-react'

export function GameHint() {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [showPing, setShowPing] = useState(false)

  // Sayfa değiştiğinde ipucunu otomatik kapa ve "yeni ipucu var" animasyonu oynat
  useEffect(() => {
    setIsOpen(false)
    setShowPing(true)
    const timer = setTimeout(() => setShowPing(false), 3000)
    return () => clearTimeout(timer)
  }, [location.pathname])

  const getHint = () => {
    const path = location.pathname
    if (path.includes('/dashboard')) return "Ana Sayfa: Takımının genel durumunu, yaklaşan fikstürü ve günlük görevlerini buradan takip edebilirsin. Bol bol coin kazanmak için görevleri aksatma!"
    if (path.includes('/roster')) return "Kadro: Sahip olduğun tüm oyuncuların listesi. Güç (OVR) değerlerine bakarak takımın zayıf karnını tespit et."
    if (path.includes('/depth-chart')) return "Diziliş: Sahaya ilk çıkacak oyuncuları (Starters) buradan seçersin. Yanlış mevkiye oyuncu koyarsan takım gücün ciddi düşer!"
    if (path.includes('/tactics')) return "Taktikler: Takımının oyun karakterini belirler. Pas ağırlıklı oynamak istiyorsan iyi bir QB'ye ve WR'lere sahip olduğundan emin ol."
    if (path.includes('/market')) return "Transfer: Yeni yıldızlar keşfet! Draft sonrası eksik mevkilerini doldurmanın en iyi yolu burasıdır."
    if (path.includes('/training')) return "Antrenman: Tesislerini geliştirdiğinde oyuncuların daha hızlı seviye atlar. Uzun vadeli başarı için tesisler çok önemlidir."
    if (path.includes('/club')) return "Kulüp: Sponsorluk ve stadyum bilet gelirlerini yönet. Gelirini ne kadar artırırsan, transferlerde o kadar güçlü olursun."
    if (path.includes('/friendlies')) return "Dostluk Maçları: Diğer takımlarla hazırlık maçı atarak hem taktiklerini test et, hem de XP ve görev ödülü kazan."
    if (path.includes('/shop')) return "Mağaza: Anlık güç patlamasına ihtiyacın varsa mağaza tam sana göre! Özellikle zorlu maçlardan önce Takviye (Boost) hayat kurtarır."
    if (path.includes('/leaderboard')) return "Liderlik: Küresel sıralama! XP toplayarak veya yüksek galibiyet yüzdesiyle efsaneler arasına girebilirsin."
    if (path.includes('/match')) return "Maç Motoru: Amerikan Futbolunda maçlar Down-by-Down mekaniğiyle oynanır. Güçlü olan her zaman kazanmaz, taktik uyum çok önemlidir."
    if (path.includes('/draft')) return "Draft: Takımının iskeletini burada kuruyorsun! Seçim yapmak için 15 saniyen var. Kısıtlı sürede takımının en çok ihtiyacı olan mevkilere (Özellikle QB ve OL gibi kilit pozisyonlara) öncelik ver!"
    
    return "NFL Manager'a hoş geldin! Sol ve üst menüleri kullanarak takımını şampiyonluğa taşı."
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* Hint Bubble (when open) */}
      {isOpen && (
        <div className="mb-4 w-72 bg-gradient-to-br from-[#003366] to-[#00152b] border-2 border-accent rounded-xl shadow-[0_0_20px_rgba(255,156,0,0.3)] p-4 text-white text-sm relative animate-in fade-in slide-in-from-bottom-5">
          <button 
            onClick={() => setIsOpen(false)}
            className="absolute top-2 right-2 text-white/50 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 font-display font-black text-accent mb-2 uppercase">
            <Lightbulb className="w-5 h-5" /> Taktik İpucu
          </div>
          <p className="leading-relaxed opacity-90 font-medium">
            {getHint()}
          </p>
        </div>
      )}

      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-accent rounded-full flex items-center justify-center shadow-lg hover:bg-yellow-400 transition-colors relative"
      >
        <Lightbulb className={`w-7 h-7 text-[#001021] ${isOpen ? 'opacity-50' : 'opacity-100'}`} />
        
        {/* Ping Animation for new hint */}
        {!isOpen && showPing && (
          <span className="absolute flex h-full w-full">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
          </span>
        )}
      </button>

    </div>
  )
}
