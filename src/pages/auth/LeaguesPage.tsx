import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useFranchiseStore } from '@/store/franchiseStore'
import { Trophy, Users, Search, ArrowLeft, Plus, Lock } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'

export function LeaguesPage() {
  const [activeTab, setActiveTab] = useState<'browse' | 'create' | 'private'>('browse')
  
  const [leagues, setLeagues] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [joiningId, setJoiningId] = useState<string | null>(null)
  
  // Create League State
  const [newLeagueName, setNewLeagueName] = useState('')
  const [newLeaguePassword, setNewLeaguePassword] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  
  // Private League State
  const [inviteCode, setInviteCode] = useState('')

  const { user } = useAuthStore()
  const { initialize, setActiveFranchise } = useFranchiseStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (activeTab === 'browse') {
      fetchLeagues()
    }
  }, [activeTab])

  const fetchLeagues = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('leagues')
      .select('*, franchises(id, user_id)')
      .eq('is_public', true)
      .in('status', ['waiting', 'draft'])
      
    if (!error && data) {
      setLeagues(data)
    }
    setLoading(false)
  }

  const handleJoinLeague = async (league: any, password?: string) => {
    if (!user) return
    setJoiningId(league.id)
    try {
      const currentTeamsCount = league.franchises?.length || 0
      if (currentTeamsCount >= 8) {
        alert('Bu lig dolu!')
        return
      }

      // TODO: If private, verify password here

      const { data: newFranchise, error: fError } = await supabase.from('franchises').insert({
        league_id: league.id,
        user_id: user.id,
        team_name: `${user.user_metadata?.username || 'Menajer'} Team`,
        city: 'New City',
        club_fund: 100000
      }).select().single()

      if (fError) throw fError
      
      await initialize(user.id)
      await setActiveFranchise(newFranchise.id)
      navigate('/dashboard')
      
    } catch (err: any) {
      alert('Hata: ' + err.message)
    } finally {
      setJoiningId(null)
    }
  }

  const handleCreateLeague = async () => {
    if (!user || !newLeagueName) return
    setIsCreating(true)
    try {
      // Create league directly
      const isPublic = !newLeaguePassword
      
      const { data: newLeague, error: lError } = await supabase.from('leagues').insert({
        name: newLeagueName,
        match_time_utc: '20:00:00',
        is_public: isPublic,
        status: 'waiting', // Wait for users to fill
      }).select().single()
      
      if (lError) throw lError

      // Create franchise for the commissioner (creator)
      const { data: newFranchise, error: fError } = await supabase.from('franchises').insert({
        league_id: newLeague.id,
        user_id: user.id,
        team_name: `${user.user_metadata?.username || 'Menajer'} Team`,
        city: 'New City',
        club_fund: 100000
      }).select().single()
      
      if (fError) throw fError

      await initialize(user.id)
      await setActiveFranchise(newFranchise.id)
      navigate('/dashboard')
    } catch (err: any) {
      alert('Lig Kurma Hatası: ' + err.message)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#001021] text-white p-6 relative overflow-hidden">
      <div className="relative z-10 max-w-4xl mx-auto">
        
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/slots')} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-display font-black tracking-widest text-white uppercase">BİR LİGE KATIL</h1>
            <p className="text-accent text-xs font-bold uppercase">Açık ligleri incele veya kendi ligini kur</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-[#00152b] rounded-xl p-1 mb-8 border border-[#005c99]">
          <button 
            className={`flex-1 py-3 text-sm font-bold uppercase rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === 'browse' ? 'bg-[#003366] text-white' : 'text-white/50 hover:text-white'}`}
            onClick={() => setActiveTab('browse')}
          >
            <Search className="w-4 h-4" /> Açık Ligler
          </button>
          <button 
            className={`flex-1 py-3 text-sm font-bold uppercase rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === 'create' ? 'bg-[#003366] text-white' : 'text-white/50 hover:text-white'}`}
            onClick={() => setActiveTab('create')}
          >
            <Plus className="w-4 h-4" /> Yeni Lig Kur
          </button>
          <button 
            className={`flex-1 py-3 text-sm font-bold uppercase rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === 'private' ? 'bg-[#003366] text-white' : 'text-white/50 hover:text-white'}`}
            onClick={() => setActiveTab('private')}
          >
            <Lock className="w-4 h-4" /> Şifreli Lig
          </button>
        </div>

        {activeTab === 'browse' && (
          <div className="space-y-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 w-5 h-5" />
              <input 
                type="text" 
                placeholder="LİG ARA..." 
                className="w-full bg-[#00152b] border border-[#005c99] rounded-xl py-4 pl-12 pr-4 text-white font-bold uppercase tracking-wider focus:outline-none focus:border-accent focus:shadow-[0_0_15px_rgba(255,156,0,0.3)] transition-all"
              />
            </div>

            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full bg-[#00152b] rounded-xl border border-white/5" />
                <Skeleton className="h-24 w-full bg-[#00152b] rounded-xl border border-white/5" />
              </div>
            ) : (
              <div className="grid gap-4">
                {leagues.map(league => (
                  <div key={league.id} className="bg-gradient-to-r from-[#00254c] to-[#00152b] border border-[#005c99]/50 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-accent/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                        <Trophy className="w-6 h-6 text-yellow-500" />
                      </div>
                      <div>
                        <h3 className="font-display font-black text-xl uppercase tracking-wide">{league.name}</h3>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-xs font-bold uppercase text-white/50 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {league.franchises?.length || 0} / 8 Menajer
                          </span>
                          <span className="text-[10px] font-bold uppercase bg-green-500/20 text-green-400 px-2 py-0.5 rounded border border-green-500/30">
                            ALIM AÇIK
                          </span>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleJoinLeague(league)}
                      disabled={joiningId === league.id}
                      className="px-6 py-3 bg-accent text-[#001021] font-display font-bold text-lg uppercase tracking-wider rounded hover:bg-white hover:text-[#001021] transition-colors whitespace-nowrap"
                    >
                      {joiningId === league.id ? 'KATILINIYOR...' : 'TAKIM SEÇ'}
                    </button>
                  </div>
                ))}
                
                {leagues.length === 0 && (
                  <div className="text-center py-16 bg-[#00152b] rounded-xl border border-dashed border-white/10 text-white/50 font-bold uppercase">
                    <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50 text-white" />
                    <p>Şu an müsait lig bulunamadı.</p>
                    <p className="text-xs mt-2 font-normal normal-case">Yukarıdan "Yeni Lig Kur" sekmesine geçerek kendi liginizi oluşturabilirsiniz.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'create' && (
          <div className="bg-[#00152b] border border-[#005c99] rounded-xl p-8">
            <h2 className="text-xl font-display font-bold text-white mb-6 uppercase tracking-wider">Komisyoner Modu: Lig Kur</h2>
            
            <div className="space-y-6">
              <div>
                <label className="text-xs text-white/50 font-bold uppercase mb-2 block">Lig İsmi *</label>
                <input 
                  type="text" 
                  value={newLeagueName}
                  onChange={e => setNewLeagueName(e.target.value)}
                  placeholder="Örn: NFL Pro League" 
                  maxLength={30}
                  className="w-full bg-[#001021] border border-[#004b93] rounded p-3 text-white focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-xs text-white/50 font-bold uppercase mb-2 block">Şifre (Opsiyonel)</label>
                <input 
                  type="text" 
                  value={newLeaguePassword}
                  onChange={e => setNewLeaguePassword(e.target.value)}
                  placeholder="Boş bırakılırsa herkes katılabilir" 
                  className="w-full bg-[#001021] border border-[#004b93] rounded p-3 text-white focus:outline-none focus:border-accent"
                />
                <p className="text-[10px] text-white/40 mt-1">Sadece arkadaşlarınızla oynamak için şifre belirleyin.</p>
              </div>

              <div className="bg-[#001021] p-4 rounded border border-white/5 space-y-3">
                <p className="text-xs text-white/50 font-bold uppercase mb-2">Otomatik Kurallar</p>
                <div className="flex items-center gap-3 text-sm text-white/80">
                  <div className="w-2 h-2 rounded-full bg-accent"></div>
                  Lig dolunca veya 24 saat geçince otomatik Draft (Maçtan 4 saat önce).
                </div>
                <div className="flex items-center gap-3 text-sm text-white/80">
                  <div className="w-2 h-2 rounded-full bg-accent"></div>
                  Maçlar her gün 20:00 UTC oynanır.
                </div>
              </div>

              <button 
                onClick={handleCreateLeague}
                disabled={isCreating || !newLeagueName}
                className="w-full py-4 bg-accent text-[#001021] font-display font-black text-xl tracking-widest rounded hover:bg-white hover:text-[#001021] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? 'LİG OLUŞTURULUYOR...' : 'LİGİ OLUŞTUR'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'private' && (
          <div className="bg-[#00152b] border border-[#005c99] rounded-xl p-8 text-center">
            <Lock className="w-16 h-16 text-white/20 mx-auto mb-6" />
            <h2 className="text-xl font-display font-bold text-white mb-2 uppercase tracking-wider">ŞİFRELİ LİGE KATIL</h2>
            <p className="text-white/50 text-sm mb-8">Arkadaşınızın kurduğu özel lige katılmak için lig şifresini veya davet kodunu girin.</p>
            
            <div className="max-w-xs mx-auto space-y-4">
              <input 
                type="text" 
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value)}
                placeholder="DAVET KODU" 
                className="w-full bg-[#001021] border border-[#004b93] rounded p-4 text-center text-white font-bold uppercase tracking-widest focus:outline-none focus:border-accent"
              />
              <button 
                className="w-full py-3 bg-white text-[#001021] font-display font-bold text-lg uppercase tracking-wider rounded hover:bg-gray-200 transition-colors"
              >
                KATIL
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
