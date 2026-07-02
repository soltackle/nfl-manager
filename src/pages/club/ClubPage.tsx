import { useState } from 'react'
import { useClub } from '@/hooks/useClub'
import { useFranchiseStore } from '@/store/franchiseStore'
import { supabase } from '@/lib/supabase'
import { Building2, Lock, Briefcase, CheckCircle2 } from 'lucide-react'
import { useToastStore } from '@/store/toastStore'

export const SPONSORS = [
  { id: 'safe', name: 'Global Sigorta', desc: 'Güvenli liman. Yüksek garanti gelir, düşük başarı primi.', basePay: 500000, winBonus: 50000, color: 'from-blue-600 to-blue-800' },
  { id: 'perf', name: 'RTRT Enerji', desc: 'Performans odaklı. Düşük garanti gelir, yüksek galibiyet primi.', basePay: 200000, winBonus: 150000, color: 'from-orange-500 to-red-600' },
  { id: 'risk', name: 'Apex Yatırım', desc: 'Ya hep ya hiç! Garanti gelir yok, muazzam galibiyet primi.', basePay: 0, winBonus: 300000, color: 'from-purple-600 to-indigo-800' },
]

const costs = [1000000, 2500000, 4000000]

const formatMoney = (val: number) => `$${(val / 1000).toLocaleString()}k`

interface UpgradeCardProps {
  title: string;
  desc: string;
  level: number;
  type: 'turf' | 'capacity' | 'practice';
  bonuses: string[];
  franchiseFund: number;
  isUpgrading: boolean;
  onUpgrade: (type: 'turf' | 'capacity' | 'practice') => void;
}

const UpgradeCard = ({ title, desc, level, type, bonuses, franchiseFund, isUpgrading, onUpgrade }: UpgradeCardProps) => {
  const isMax = level >= 3
  const nextCost = isMax ? null : costs[level]
  const canAfford = nextCost ? franchiseFund >= nextCost : false

  return (
    <div className="bg-gradient-to-br from-[#00254c] to-[#00152b] border border-[#005c99] rounded-xl p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 bg-[#001021] border-b border-l border-[#005c99] px-4 py-1 rounded-bl-xl font-display font-black text-accent text-lg">
        LVL {level}
      </div>

      <div className="flex items-start gap-4 mb-6">
        <div className="bg-white/5 p-2 rounded-xl border border-white/10">
          <img src={`/icon-stadium-${type}.svg`} alt={title} className="w-12 h-12 object-contain" />
        </div>
        <div>
          <h3 className="font-display font-bold text-xl uppercase tracking-wider text-white">{title}</h3>
          <p className="text-white/50 text-sm">{desc}</p>
        </div>
      </div>

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

      {!isMax ? (
        <div className="border-t border-white/10 pt-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase text-white/50 mb-1">Sonraki Seviye ({level + 1})</p>
            <p className="font-display font-black text-lg text-white">{formatMoney(nextCost!)}</p>
          </div>
          <button 
            onClick={() => onUpgrade(type)}
            disabled={!canAfford || isUpgrading}
            className={`px-6 py-3 rounded font-display font-bold uppercase tracking-wider transition-colors ${canAfford ? 'bg-accent text-[#001021] hover:bg-white hover:text-[#001021]' : 'bg-white/5 text-white/30 cursor-not-allowed border border-white/10'}`}
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

export function ClubPage() {
  const { stadium, upgradeStadium } = useClub()
  const { franchise, initialize } = useFranchiseStore()
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [isSelectingSponsor, setIsSelectingSponsor] = useState(false)

  const handleUpgrade = async (type: 'turf' | 'capacity' | 'practice') => {
    setIsUpgrading(true)
    try {
      await upgradeStadium(type)
      useToastStore.getState().addToast('Yükseltme tamamlandı!', 'success')
    } catch (err: unknown) {
      if (err instanceof Error) {
        useToastStore.getState().addToast('Hata: ' + (err instanceof Error ? err.message : String(err)), 'error')
      } else {
        useToastStore.getState().addToast('Bilinmeyen Hata', 'error')
      }
    } finally {
      setIsUpgrading(false)
    }
  }

  const handleSelectSponsor = async (sponsorId: string) => {
    if (!franchise) return
    setIsSelectingSponsor(true)
    try {
      const { error } = await supabase.from('franchises').update({ active_sponsor_id: sponsorId }).eq('id', franchise.id)
      if (error) throw error
      await initialize(franchise.user_id)
      useToastStore.getState().addToast('Sponsor başarıyla seçildi! Anlaşma sezon sonuna kadar geçerli.', 'success')
    } catch (err: unknown) {
      if (err instanceof Error) {
        useToastStore.getState().addToast('Hata: ' + (err instanceof Error ? err.message : String(err)), 'error')
      } else {
        useToastStore.getState().addToast('Bilinmeyen Hata', 'error')
      }
    } finally {
      setIsSelectingSponsor(false)
    }
  }

  return (
    <div className="space-y-6 pt-4">
      <div className="bg-[#001021] rounded-xl p-8 border border-[#005c99] shadow-xl text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#003366]/30 to-transparent"></div>
        <Building2 className="w-16 h-16 text-white/20 mx-auto mb-4 relative z-10" />
        <h1 className="text-3xl font-display font-black text-white uppercase tracking-widest relative z-10">KULÜP & TESİSLER</h1>
        <p className="text-accent text-sm font-bold uppercase relative z-10">Stadyumunu Geliştir, Gelirini Artır</p>
        
        <div className="mt-8 flex justify-center gap-8 relative z-10">
          <div className="bg-[#00152b] border border-[#005c99] px-6 py-3 rounded-xl flex items-center gap-4">
            <img src="/icon-clubfund.svg" alt="Kulüp Fonu" className="w-9 h-9 object-contain" />
            <div className="text-left">
              <div className="text-[10px] font-bold uppercase text-white/50">Kulüp Fonu</div>
              <div className="font-display font-black text-xl text-white">{franchise?.club_fund ? formatMoney(franchise.club_fund) : '$0.0M'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <UpgradeCard title="Stadyum Zemin Kalitesi" desc="İyi bir saha zemini takımınızın ev sahibi avantajını artırır ve rakipleri zorlar." level={stadium.turf_level} type="turf" bonuses={['Ev Sahibi Avantajı: +%2', 'Ev Sahibi Avantajı: +%4', 'Ev Sahibi Avantajı: +%6']} franchiseFund={franchise?.club_fund || 0} isUpgrading={isUpgrading} onUpgrade={handleUpgrade} />
        <UpgradeCard title="Stadyum Kapasitesi" desc="Daha fazla koltuk, bilet gelirlerini ve maç günü kazançlarını katlar." level={stadium.capacity_level} type="capacity" bonuses={['Maç Günü Geliri: +%20', 'Maç Günü Geliri: +%40', 'Maç Günü Geliri: +%60']} franchiseFund={franchise?.club_fund || 0} isUpgrading={isUpgrading} onUpgrade={handleUpgrade} />
        <UpgradeCard title="Antrenman Tesisleri" desc="Modern tesisler koçların oyuncuları çok daha hızlı geliştirmesini sağlar." level={stadium.practice_facility_level} type="practice" bonuses={['Antrenman Verimi: +%10', 'Antrenman Verimi: +%25', 'Antrenman Verimi: +%50']} franchiseFund={franchise?.club_fund || 0} isUpgrading={isUpgrading} onUpgrade={handleUpgrade} />
      </div>

      <div className="mt-12">
        <div className="flex items-center gap-3 mb-6">
          <Briefcase className="w-8 h-8 text-accent" />
          <h2 className="text-2xl font-display font-black text-white uppercase tracking-wider">Kulüp Sponsoru</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SPONSORS.map((sponsor) => {
            const isActive = franchise?.active_sponsor_id === sponsor.id
            return (
              <div key={sponsor.id} className={`bg-gradient-to-br ${sponsor.color} rounded-xl p-6 relative overflow-hidden shadow-xl transition-transform hover:-translate-y-1 ${isActive ? 'ring-4 ring-accent' : 'opacity-80 hover:opacity-100'}`}>
                {isActive && (
                  <div className="absolute top-4 right-4 bg-accent text-[#001021] px-3 py-1 rounded-full font-bold text-xs uppercase flex items-center gap-1 shadow-lg">
                    <CheckCircle2 className="w-4 h-4" /> Aktif
                  </div>
                )}
                
                <img src={`/icon-sponsor-${sponsor.id}.svg`} alt={sponsor.name} className="w-14 h-14 object-contain mb-2 drop-shadow-lg" />
                <h3 className="font-display font-black text-2xl text-white uppercase tracking-widest mb-2 mt-2">{sponsor.name}</h3>
                <p className="text-white/80 text-sm font-bold h-12">{sponsor.desc}</p>
                
                <div className="bg-black/30 rounded-lg p-4 mt-6 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white/60 uppercase">Garanti Gelir (Maç Başı)</span>
                    <span className="font-display font-bold text-white text-lg">{formatMoney(sponsor.basePay)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white/60 uppercase">Galibiyet Primi</span>
                    <span className="font-display font-bold text-accent text-lg">+{formatMoney(sponsor.winBonus)}</span>
                  </div>
                </div>

                {!isActive && (
                  <button onClick={() => handleSelectSponsor(sponsor.id)} disabled={isSelectingSponsor} className="w-full mt-6 bg-white hover:bg-gray-100 text-[#001021] font-display font-black uppercase py-3 rounded shadow-lg transition-colors">
                    {isSelectingSponsor ? 'Anlaşılıyor...' : 'Sponsorluk Anlaşması İmzala'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
        <p className="text-center text-white/40 text-xs mt-4 font-bold uppercase">* Sponsorluk anlaşmaları sezon boyunca değiştirilemez. Kulüp geliri her maç sonu otomatik yatar.</p>
      </div>
    </div>
  )
}
