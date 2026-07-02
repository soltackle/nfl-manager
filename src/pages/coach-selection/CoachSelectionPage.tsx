import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useFranchiseStore } from '@/store/franchiseStore'
import { ArrowRight } from 'lucide-react'

const OFFENSIVE_TRAITS = [
  "Air Raid Master", "Run Heavy Guru", "West Coast Expert", "Play-Action Specialist", "Red Zone Strategist",
  "Clock Manager", "QB Whisperer", "O-Line Developer", "Creative Trickster", "Spread Offense Innovator",
  "No-Huddle Commander", "Screen Pass Architect", "Fourth Down Gambler", "Conservative Caller", "Audible Master",
  "Mismatch Hunter", "Power Run Grader", "Vertical Bomber", "Two-Minute Drill Expert", "Short Yardage Specialist"
]

const DEFENSIVE_TRAITS = [
  "Blitz Master", "Zone Coverage Expert", "Man-to-Man Specialist", "Run Stopper", "Turnover Machine",
  "Red Zone Wall", "D-Line Motivator", "Secondary Guru", "Bend But Don't Break", "Press Coverage Advocate",
  "Third Down Nightmare", "Gap Discipline Specialist", "Edge Rush Developer", "Trench Warfare Tactician", "Spy Scheme Master",
  "Prevent Defense Expert", "Disguised Coverage Genius", "Hard Hitting Enforcer", "Stunt & Loop Master", "Goal Line Stand Expert"
]

const NAMES = ["Bill", "Andy", "Sean", "Kyle", "Mike", "John", "Pete", "Dan", "Matt", "Brian", "Zac", "Kevin", "DeMeco", "Mike", "Doug"]
const LAST_NAMES = ["Belichick", "Reid", "McVay", "Shanahan", "Tomlin", "Harbaugh", "Carroll", "Campbell", "LaFleur", "Daboll", "Taylor", "O'Connell", "Ryans", "McDaniel", "Pederson"]

interface CoachOption {
  id: string
  name: string
  type: 'offensive' | 'defensive'
  prediction_rating: number
  traits: string[]
}

function generateCoaches(type: 'offensive' | 'defensive'): CoachOption[] {
  const pool = type === 'offensive' ? OFFENSIVE_TRAITS : DEFENSIVE_TRAITS;
  const options: CoachOption[] = [];
  
  for (let i = 0; i < 3; i++) {
    const shuffledTraits = [...pool].sort(() => 0.5 - Math.random());
    const name = `${NAMES[Math.floor(Math.random() * NAMES.length)]} ${LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]}`
    options.push({
      id: crypto.randomUUID(),
      name,
      type,
      prediction_rating: 60 + Math.floor(Math.random() * 30), // 60-89
      traits: shuffledTraits.slice(0, 3)
    })
  }
  return options;
}

export function CoachSelectionPage() {
  const navigate = useNavigate()
  const { franchise } = useFranchiseStore()
  
  const [offensiveCoaches, setOffensiveCoaches] = useState<CoachOption[]>([])
  const [defensiveCoaches, setDefensiveCoaches] = useState<CoachOption[]>([])
  
  const [selectedOffensive, setSelectedOffensive] = useState<CoachOption | null>(null)
  const [selectedDefensive, setSelectedDefensive] = useState<CoachOption | null>(null)
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    // Check if they already have coaches
    const checkExisting = async () => {
      if (!franchise) return;
      const { data } = await supabase.from('coaches').select('*').eq('franchise_id', franchise.id);
      if (data && data.length >= 2) {
        navigate('/dashboard'); // already has coaches
      }
    }
    checkExisting();

    setOffensiveCoaches(generateCoaches('offensive'))
    setDefensiveCoaches(generateCoaches('defensive'))
  }, [franchise, navigate])

  const handleConfirm = async () => {
    if (!selectedOffensive || !selectedDefensive || !franchise) return;
    setIsSubmitting(true);
    
    try {
      // Clean IDs, replace with random so we can insert cleanly without relying on local generated ones if needed
      // Actually the local ones are valid UUIDs, so it's fine.
      const coachesToInsert = [
        { ...selectedOffensive, franchise_id: franchise.id },
        { ...selectedDefensive, franchise_id: franchise.id }
      ]
      
      const { error } = await supabase.from('coaches').insert(coachesToInsert);
      if (error) throw error;
      
      navigate('/dashboard');
    } catch (err: unknown) {
      alert("Hata: " + (err instanceof Error ? err.message : String(err)));
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#001021] text-white p-6 pb-24">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-display font-black text-white uppercase tracking-widest">
            KOÇ EKİBİNİ KUR
          </h1>
          <p className="text-white/60">
            Takımının sahadaki zekasını temsil edecek Koordinatörlerini seç. <br />
            Seçeceğin koçlar, rakibin oyunlarını okuma (Prediction) ve kilit anlarda taktiksel avantaj sağlama özelliklerine (Traits) sahiptir.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* OFFENSIVE */}
          <div className="bg-[#00152b] p-6 rounded-xl border border-[#005c99]/30">
            <div className="flex items-center gap-3 mb-6">
              <img src="/coach-offensive.svg" alt="OC" className="w-12 h-12 rounded-full object-cover border-2 border-accent" />
              <h2 className="text-2xl font-display font-bold uppercase">Hücum Koçu (OC)</h2>
            </div>
            <div className="space-y-4">
              {offensiveCoaches.map(coach => (
                <div 
                  key={coach.id}
                  onClick={() => setSelectedOffensive(coach)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedOffensive?.id === coach.id 
                      ? 'bg-accent/10 border-accent shadow-[0_0_15px_rgba(255,156,0,0.2)]' 
                      : 'bg-[#001021] border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-lg">{coach.name}</span>
                    <span className="text-accent font-display font-black text-xl">{coach.prediction_rating} OVR</span>
                  </div>
                  <div className="text-[10px] uppercase text-white/50 mb-2">Oyun Okuma & Tahmin</div>
                  
                  <div className="flex flex-wrap gap-1 mt-3">
                    {coach.traits.map(t => (
                      <span key={t} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs font-bold text-white/80">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DEFENSIVE */}
          <div className="bg-[#00152b] p-6 rounded-xl border border-[#005c99]/30">
            <div className="flex items-center gap-3 mb-6">
              <img src="/coach-defensive.svg" alt="DC" className="w-12 h-12 rounded-full object-cover border-2 border-green-500" />
              <h2 className="text-2xl font-display font-bold uppercase">Savunma Koçu (DC)</h2>
            </div>
            <div className="space-y-4">
              {defensiveCoaches.map(coach => (
                <div 
                  key={coach.id}
                  onClick={() => setSelectedDefensive(coach)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedDefensive?.id === coach.id 
                      ? 'bg-green-500/10 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.2)]' 
                      : 'bg-[#001021] border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-lg">{coach.name}</span>
                    <span className="text-green-400 font-display font-black text-xl">{coach.prediction_rating} OVR</span>
                  </div>
                  <div className="text-[10px] uppercase text-white/50 mb-2">Oyun Okuma & Tahmin</div>
                  
                  <div className="flex flex-wrap gap-1 mt-3">
                    {coach.traits.map(t => (
                      <span key={t} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs font-bold text-white/80">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-8">
          <button
            onClick={handleConfirm}
            disabled={!selectedOffensive || !selectedDefensive || isSubmitting}
            className="flex items-center gap-2 px-12 py-4 bg-white text-black font-display font-black text-xl rounded-xl uppercase tracking-widest hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? 'Sözleşmeler İmzalanıyor...' : 'Seçimleri Onayla ve Ana Merkeze Git'}
            {!isSubmitting && <ArrowRight className="w-6 h-6" />}
          </button>
        </div>

      </div>
    </div>
  )
}
