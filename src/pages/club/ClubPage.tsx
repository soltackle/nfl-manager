import { useState } from 'react'
import { useClub } from '@/hooks/useClub'
import { useFranchiseStore } from '@/store/franchiseStore'
import { Building2, TrendingUp, Users, Activity, Lock } from 'lucide-react'

export function ClubPage() {
  const { stadium, upgradeStadium } = useClub()
  const { franchise } = useFranchiseStore()
  const [isUpgrading, setIsUpgrading] = useState(false)

  const handleUpgrade = async (type: 'turf' | 'capacity' | 'practice') => {
    setIsUpgrading(true)
    try {
      await upgradeStadium(type)
      alert('Yükseltme tamamlandı!')
    } catch (err: any) {
      alert('Hata: ' + err.message)
    } finally {
      setIsUpgrading(false)
    }
  }

  const costs = [1000000, 2500000, 4000000]

  const formatMoney = (val: number) => `$${(val / 1000000).toFixed(1)}M`

  const UpgradeCard = ({ 
    title, 
    desc, 
    level, 
    type, 
    icon: Icon,
    bonuses
  }: { 
    title: string, desc: string, level: number, type: 'turf' | 'capacity' | 'practice', icon: any, bonuses: string[] 
  }) => {
    const isMax = level >= 3
    const nextCost = isMax ? null : costs[level]
    const canAfford = nextCost ? (franchise?.club_fund || 0) >= nextCost : false

    return (
      <div className="bg-gradient-to-br from-[#00254c] to-[#00152b] border border-[#005c99] rounded-xl p-6 relative overflow-hidden">
        {/* Level Indicator */}
        <div className="absolute top-0 right-0 bg-[#001021] border-b border-l border-[#005c99] px-4 py-1 rounded-bl-xl font-display font-black text-accent text-lg">
          LVL {level}
        </div>

        <div className="flex items-start gap-4 mb-6">
          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
            <Icon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="font-display font-bold text-xl uppercase tracking-wider text-white">{title}</h3>
            <p className="text-white/50 text-sm">{desc}</p>
          </div>
        </div>

        {/* Bonus List */}
        <div className="space-y-2 mb-6">
          <p className="text-xs font-bold uppercase text-white/50">Mevcut Bonuslar</p>
          {level === 0 ? (
            <div className="text-sm text-red-400 font-bold bg-red-500/10 p-2 rounded border border-red-500/20">Bonus Yok</div>
          ) : (
            <div className="text-sm text-green-400 font-bold bg-green-500/10 p-2 rounded border border-green-500/20">
              {bonuses[level - 1]}
            </div>
          )}
        </div>

        {/* Upgrade Action */}
        {!isMax ? (
          <div className="border-t border-white/10 pt-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase text-white/50 mb-1">Sonraki Seviye ({level + 1})</p>
              <p className="font-display font-black text-lg text-white">{formatMoney(nextCost!)}</p>
            </div>
            <button 
              onClick={() => handleUpgrade(type)}
              disabled={!canAfford || isUpgrading}
              className={`px-6 py-3 rounded font-display font-bold uppercase tracking-wider transition-colors ${
                canAfford 
                  ? 'bg-accent text-[#001021] hover:bg-white hover:text-[#001021]' 
                  : 'bg-white/5 text-white/30 cursor-not-allowed border border-white/10'
              }`}
            >
              {isUpgrading ? 'Yükseltiliyor...' : 'YÜKSELT'}
            </button>
          </div>
        ) : (
          <div className="border-t border-white/10 pt-4 text-center">
            <div className="inline-flex items-center gap-2 text-accent font-bold uppercase bg-accent/10 px-4 py-2 rounded-full">
              <Lock className="w-4 h-4" /> Maksimum Seviye
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6 pt-4">
      {/* Header */}
      <div className="bg-[#001021] rounded-xl p-8 border border-[#005c99] shadow-xl text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#003366]/30 to-transparent"></div>
        <Building2 className="w-16 h-16 text-white/20 mx-auto mb-4 relative z-10" />
        <h1 className="text-3xl font-display font-black text-white uppercase tracking-widest relative z-10">KULÜP & TESİSLER</h1>
        <p className="text-accent text-sm font-bold uppercase relative z-10">Stadyumunu Geliştir, Gelirini Artır</p>
        
        <div className="mt-8 flex justify-center gap-8 relative z-10">
          <div className="bg-[#00152b] border border-[#005c99] px-6 py-3 rounded-xl flex items-center gap-4">
            <div className="bg-[#00a2ff] w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-inner">$</div>
            <div className="text-left">
              <div className="text-[10px] font-bold uppercase text-white/50">Kulüp Fonu</div>
              <div className="font-display font-black text-xl text-white">{franchise?.club_fund ? formatMoney(franchise.club_fund) : '$0.0M'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrades Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <UpgradeCard 
          title="Stadyum Zemin Kalitesi" 
          desc="İyi bir saha zemini takımınızın ev sahibi avantajını artırır ve rakipleri zorlar."
          level={stadium.turf_level}
          type="turf"
          icon={TrendingUp}
          bonuses={['Ev Sahibi Avantajı: +%2', 'Ev Sahibi Avantajı: +%4', 'Ev Sahibi Avantajı: +%6']}
        />

        <UpgradeCard 
          title="Stadyum Kapasitesi" 
          desc="Daha fazla koltuk, bilet gelirlerini ve maç günü kazançlarını katlar."
          level={stadium.capacity_level}
          type="capacity"
          icon={Users}
          bonuses={['Maç Günü Geliri: +%20', 'Maç Günü Geliri: +%40', 'Maç Günü Geliri: +%60']}
        />

        <UpgradeCard 
          title="Antrenman Tesisleri" 
          desc="Modern tesisler koçların oyuncuları çok daha hızlı geliştirmesini sağlar."
          level={stadium.practice_facility_level}
          type="practice"
          icon={Activity}
          bonuses={['Antrenman Verimi: +%10', 'Antrenman Verimi: +%25', 'Antrenman Verimi: +%50']}
        />
      </div>
    </div>
  )
}
