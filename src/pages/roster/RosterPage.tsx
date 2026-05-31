import { useState } from 'react'
import { useRoster } from '@/hooks/useRoster'
import { Card, CardContent } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { Shield, ChevronRight } from 'lucide-react'

const OFFENSE_POS = ['QB', 'RB', 'WR', 'TE', 'OL']
const DEFENSE_POS = ['DE', 'LB', 'CB', 'S']
const SPECIAL_POS = ['K']

export function RosterPage() {
  const { roster, isLoading } = useRoster()
  const [activeTab, setActiveTab] = useState<'ALL' | 'OFF' | 'DEF' | 'ST'>('ALL')

  if (isLoading) return (
    <div className="space-y-4 pt-4">
      <Skeleton className="h-12 w-full bg-white/5" />
      <Skeleton className="h-[400px] w-full bg-white/5" />
    </div>
  )

  const filteredRoster = roster.filter(p => {
    if (activeTab === 'ALL') return true
    if (activeTab === 'OFF') return OFFENSE_POS.includes(p.position)
    if (activeTab === 'DEF') return DEFENSE_POS.includes(p.position)
    if (activeTab === 'ST') return SPECIAL_POS.includes(p.position)
    return true
  })

  return (
    <div className="space-y-4 pt-4 max-w-4xl mx-auto pb-20">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 bg-[#00152b]/80 p-4 rounded-xl border border-[#005c99]/30">
        <Shield className="h-8 w-8 text-accent" />
        <div>
          <h1 className="text-xl font-display font-bold text-white tracking-wider">KADRO</h1>
          <p className="text-white/60 text-xs font-bold uppercase">{roster.length} Oyuncu</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-[#00152b] p-1 rounded-lg border border-white/5 overflow-x-auto hide-scrollbar">
        {['ALL', 'OFF', 'DEF', 'ST'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-1 min-w-[80px] text-xs font-bold uppercase py-2 px-4 rounded transition-all ${
              activeTab === tab 
                ? 'bg-accent text-[#00152b] shadow-[0_0_10px_rgba(255,156,0,0.5)]' 
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab === 'ALL' ? 'TÜMÜ' : tab === 'OFF' ? 'HÜCUM' : tab === 'DEF' ? 'SAVUNMA' : 'ÖZEL'}
          </button>
        ))}
      </div>

      {/* Roster List */}
      <div className="grid gap-2 mt-4">
        {filteredRoster.map(player => (
          <div 
            key={player.id} 
            className="flex items-center justify-between bg-gradient-to-r from-[#00254c] to-[#00152b] p-3 rounded-lg border border-[#004b93]/50 cursor-pointer hover:border-accent/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded flex items-center justify-center font-display font-bold text-sm shadow-inner ${
                OFFENSE_POS.includes(player.position) ? 'bg-blue-900/50 text-blue-300 border border-blue-500/30' :
                DEFENSE_POS.includes(player.position) ? 'bg-red-900/50 text-red-300 border border-red-500/30' :
                'bg-yellow-900/50 text-yellow-300 border border-yellow-500/30'
              }`}>
                {player.position}
              </div>
              <div>
                <div className="text-white font-bold text-sm">{player.name}</div>
                <div className="text-green-400 text-xs font-bold mt-0.5">${(player.value / 1000000).toFixed(1)}M</div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center justify-center w-12 h-12 rounded-full bg-[#001021] border-2 border-[#005c99]">
                <span className="text-white font-display font-bold text-lg leading-none">{player.overall}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-white/30" />
            </div>
          </div>
        ))}
        
        {filteredRoster.length === 0 && (
          <div className="text-center py-12 text-white/50 text-sm font-bold border border-dashed border-white/10 rounded-xl">
            {activeTab === 'ALL' ? 'Kadronuzda oyuncu bulunmuyor. Transfer piyasasından oyuncu alın veya liginizi admin panelinden botlarla doldurun.' : 'Bu mevkide oyuncu bulunmuyor.'}
          </div>
        )}
      </div>

    </div>
  )
}
