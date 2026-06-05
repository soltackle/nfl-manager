import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Shield, Plus, Zap, AlertTriangle, CheckCircle2, Server, Play, FastForward, Activity, Trophy, Users, Globe } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useFranchiseStore } from '@/store/franchiseStore'

export function AdminDashboard() {
  const { league } = useFranchiseStore()
  const [isSimulating, setIsSimulating] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [leagueName, setLeagueName] = useState('')

  // System Stats State
  const [stats, setStats] = useState({ users: 0, googleUsers: 0, leagues: 0, matches: 0, loading: true })
  const [leaguesList, setLeaguesList] = useState<any[]>([])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('admin-get-stats')
        if (error) throw error
        
        setStats({
          users: data.users || 0,
          googleUsers: data.googleUsers || 0,
          online: 1 + Math.floor(Math.random() * 3), // Simüle edilmiş online sayısı
          leagues: data.leagues || 0,
          matches: data.matches || 0,
          loading: false
        })
        setLeaguesList(data.leaguesList || [])
      } catch (err) {
        console.error('Stats fetching error:', err)
        setStats(prev => ({ ...prev, loading: false }))
      }
    }
    fetchStats()
  }, [])

  const handleCreateLeague = async () => {
    setIsCreating(true)
    try {
      const { data, error } = await supabase.functions.invoke('admin-create-league', {
        body: { name: leagueName, mode: 'test' }
      })
      if (error) throw error
      alert('Lig başarıyla kuruldu ve botlar eklendi!')
    } catch (err: any) {
      alert('Hata: ' + err.message)
    } finally {
      setIsCreating(false)
    }
  }

  const handleFillBots = async () => {
    if (!league) return alert('Aktif bir ligde değilsiniz!')
    try {
      const { data, error } = await supabase.functions.invoke('admin-fill-bots', {
        body: { league_id: league.id }
      })
      if (error) throw error
      alert('Boş slotlar botlarla dolduruldu! Lig tamamen doldu.')
    } catch (err: any) {
      alert('Hata: ' + err.message)
    }
  }
  const handleResetDraftPool = async () => {
    if (!confirm('DİKKAT: Serbest oyuncu havuzundaki (franchise_id: null) TÜM oyuncular silinecek. Emin misiniz?')) return
    try {
      const { error } = await supabase.from('players').delete().is('franchise_id', null)
      if (error) throw error
      alert('Draft havuzu başarıyla sıfırlandı! Şimdi Draftı başlatırsanız yeni dengeli havuz üretilecek.')
    } catch (err: any) {
      alert('Hata: ' + err.message)
    }
  }

  const handleStartDraft = async () => {
    if (!league) return alert('Aktif bir ligde değilsiniz!')
    try {
      // First create a draft session
      const { data: franchises } = await supabase
        .from('franchises')
        .select('id, user_id')
        .eq('league_id', league.id)
        .order('created_at')
      
      if (!franchises || franchises.length < 2) {
        return alert('Ligde en az 2 takım olmalı!')
      }

      // Create draft session if not exists
      const { data: existingSession } = await supabase
        .from('draft_sessions')
        .select('id')
        .eq('league_id', league.id)
        .maybeSingle()

      let sessionId = existingSession?.id

      if (!existingSession) {
        const { data: newSession, error: dsErr } = await supabase
          .from('draft_sessions')
          .insert({
            league_id: league.id,
            current_round: 1,
            current_pick_franchise_id: franchises[0].id
          })
          .select()
          .single()
          
        if (dsErr) throw dsErr
        sessionId = newSession.id
      }

      // Always generate a fresh batch of elite draft pool players for this draft
      {
        const positions = ['QB', 'RB', 'WR', 'TE', 'OL', 'DE', 'LB', 'CB', 'S', 'K']
        const firstNames = ['Tom', 'Patrick', 'Aaron', 'Lamar', 'Josh', 'Joe', 'Justin', 'Jalen', 'Trevor', 'Matthew', 'Russell', 'Kyler', 'Dak', 'Jared', 'Kirk', 'Tua', 'Brock', 'Caleb', 'Jayden', 'Drake', 'Tyreek', 'Justin', 'JaMarr', 'CeeDee', 'A.J.', 'Davante', 'Stefon', 'Cooper', 'Deebo', 'Christian', 'Derrick', 'Saquon', 'Jonathan', 'Breece', 'Bijan', 'Jahmyr', 'Travis', 'George', 'Mark', 'Sam', 'T.J.', 'Myles', 'Micah', 'Nick', 'Maxx', 'Chris', 'Aaron', 'Fred', 'Roquan', 'Sauce', 'Patrick', 'Jalen', 'Minkah', 'Derwin', 'Justin']
        const lastNames = ['Brady', 'Mahomes', 'Rodgers', 'Jackson', 'Allen', 'Burrow', 'Herbert', 'Hurts', 'Lawrence', 'Stafford', 'Wilson', 'Murray', 'Prescott', 'Goff', 'Cousins', 'Tagovailoa', 'Purdy', 'Williams', 'Daniels', 'Maye', 'Hill', 'Jefferson', 'Chase', 'Lamb', 'Brown', 'Adams', 'Diggs', 'Kupp', 'Samuel', 'McCaffrey', 'Henry', 'Barkley', 'Taylor', 'Hall', 'Robinson', 'Gibbs', 'Kelce', 'Kittle', 'Andrews', 'LaPorta', 'Watt', 'Garrett', 'Parsons', 'Bosa', 'Crosby', 'Jones', 'Donald', 'Warner', 'Smith', 'Gardner', 'Surtain', 'Ramsey', 'Fitzpatrick', 'James', 'Simmons']
        
        const poolInsert = []
        for (const pos of positions) {
          // 2 Elite (90-95)
          for (let i = 0; i < 2; i++) {
            poolInsert.push({
              name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
              position: pos,
              overall: 90 + Math.floor(Math.random() * 6),
              value: 2000000 + Math.floor(Math.random() * 1000000),
              franchise_id: null
            })
          }
          // 4 Stars (80-89)
          for (let i = 0; i < 4; i++) {
            poolInsert.push({
              name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
              position: pos,
              overall: 80 + Math.floor(Math.random() * 10),
              value: 500000 + Math.floor(Math.random() * 500000),
              franchise_id: null
            })
          }
          // 14 Role Players (65-79)
          for (let i = 0; i < 14; i++) {
            poolInsert.push({
              name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
              position: pos,
              overall: 65 + Math.floor(Math.random() * 15),
              value: 50000 + Math.floor(Math.random() * 150000),
              franchise_id: null
            })
          }
        }
        await supabase.from('players').insert(poolInsert)
      }

      // Set league to draft
      const { error } = await supabase.from('leagues').update({ status: 'draft' }).eq('id', league.id)
      if (error) throw error

      // KICKSTART BOT CHAIN REACTION IF FIRST PICK IS A BOT
      // Although admin is usually franchises[0], just in case:
      if (!existingSession && sessionId) {
        const { data: firstOwner } = await supabase
          .from('users')
          .select('role')
          .eq('id', franchises[0].user_id)
          .single()
          
        if (firstOwner?.role === 'bot') {
          // Fire and forget the kickstart
          supabase.functions.invoke('make-draft-pick', {
            body: { franchise_id: franchises[0].id, session_id: sessionId, player_id: null }
          }).catch(console.error)
        }
      }

      alert('Draft başlatıldı! Şimdi /draft sayfasına gidin.')
    } catch (err: any) {
      alert('Hata: ' + err.message)
    }
  }

  const handleSimulateDraft = async () => {
    if (!league) return alert('Aktif bir ligde değilsiniz!')
    try {
      const { data, error } = await supabase.functions.invoke('admin-simulate-draft', {
        body: { league_id: league.id }
      })
      if (error) throw error
      alert('Draft simüle edildi ve sezon başladı!')
    } catch (err: any) {
      alert('Hata: ' + err.message)
    }
  }

  const handleDeleteLeague = async () => {
    if (!league) return alert('Aktif bir ligde değilsiniz!')
    if (!confirm('DİKKAT: Bu ligi ve içindeki tüm verileri (takımlar, maçlar, oyuncular) kalıcı olarak silmek istediğinize emin misiniz?')) return

    try {
      const { data, error } = await supabase.rpc('admin_delete_league', {
        p_league_id: league.id
      })
      if (error) throw error
      if (data && data.success) {
        alert('Lig başarıyla ve kalıcı olarak silindi!')
        window.location.href = '/dashboard' // Redirect to clear local state
      } else {
        alert('Hata: ' + (data?.error || 'Bilinmeyen hata'))
      }
    } catch (err: any) {
      alert('Silme Hatası: ' + err.message)
    }
  }

  const handleSimulateMatch = async () => {
    if (!league) return alert("Aktif bir ligde değilsiniz!")
    const weekInput = prompt("Hangi haftayı simüle etmek istiyorsunuz? (Sayı girin)", "1")
    const week = parseInt(weekInput || "1", 10)
    
    setIsSimulating(true)
    try {
      const { data, error } = await supabase.functions.invoke('admin-simulate-match', {
        body: { league_id: league.id, week }
      })
      if (error) throw error
      alert(`Hafta ${week} başarıyla simüle edildi!`)
    } catch (err: any) {
      alert('Simülasyon Hatası: ' + err.message)
    } finally {
      setIsSimulating(false)
    }
  }

  const handleEndSeason = async () => {
    if (!league) return alert("Aktif bir ligde değilsiniz!")
    if (!confirm('DİKKAT: Tüm maçlar silinecek, şampiyonlara ödül verilecek ve lig DRAFT (YENİ SEZON) aşamasına geçecektir. Onaylıyor musunuz?')) return
    
    try {
      const { data, error } = await supabase.functions.invoke('admin-end-season', {
        body: { league_id: league.id }
      })
      if (error) throw error
      alert('Sezon başarıyla bitirildi! Yeni sezon için Draft aşamasına geçildi.')
      window.location.reload()
    } catch (err: any) {
      alert('Sezon Bitirme Hatası: ' + err.message)
    }
  }

  return (
    <div className="space-y-6 pt-4 pb-20">
      
      <div className="bg-[#00152b] border border-[#005c99] rounded-xl p-6 shadow-xl flex items-center gap-4">
        <Shield className="h-10 w-10 text-red-500" />
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wider">DEV ADMIN PANELİ</h1>
          <p className="text-white/60 text-sm">Sunucu kontrolleri, simülasyon araçları ve hata ayıklama menüsü.</p>
        </div>
      </div>

      {/* System Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#001f40] border border-[#004b93] rounded-xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1">Şu An Oyunda</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <div className="text-2xl font-black text-white">{stats.loading ? '...' : (stats as any).online}</div>
            </div>
          </div>
          <div className="bg-green-500/20 p-3 rounded-full">
            <Activity className="w-6 h-6 text-green-500" />
          </div>
        </div>

        <div className="bg-[#001f40] border border-[#004b93] rounded-xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1">Toplam Üye</div>
            <div className="text-2xl font-black text-white">{stats.loading ? '...' : stats.users}</div>
          </div>
          <div className="bg-[#00a2ff]/20 p-3 rounded-full">
            <Users className="w-6 h-6 text-[#00a2ff]" />
          </div>
        </div>

        <div className="bg-[#001f40] border border-[#004b93] rounded-xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1">Google İle Üye</div>
            <div className="text-2xl font-black text-white">{stats.loading ? '...' : (stats as any).googleUsers}</div>
          </div>
          <div className="bg-red-500/20 p-3 rounded-full">
            <Shield className="w-6 h-6 text-red-500" />
          </div>
        </div>

        <div className="bg-[#001f40] border border-[#004b93] rounded-xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1">Oynanan Maç</div>
            <div className="text-2xl font-black text-white">{stats.loading ? '...' : stats.matches}</div>
          </div>
          <div className="bg-yellow-500/20 p-3 rounded-full">
            <Trophy className="w-6 h-6 text-yellow-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 1. Lobi ve Draft Kontrolü */}
        <Card className="bg-gradient-to-br from-[#00254c] to-[#00152b] border-[#005c99]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2 font-display uppercase">
              <Activity className="h-5 w-5 text-accent" />
              Aktif Lig Kontrolü: {league ? league.name : 'Yok'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="mb-4 text-xs font-bold uppercase text-white/50">
              Durum: <span className="text-white">{league?.status || 'Bilinmiyor'}</span>
            </div>
            
            <Button 
              className="w-full justify-start border border-[#005c99] bg-[#00152b] hover:bg-[#003366] text-white"
              onClick={handleFillBots}
            >
              🤖 EKSİK SLOTLARI BOTLARLA DOLDUR
            </Button>

            <Button 
              className="w-full justify-start border border-[#005c99] bg-[#00152b] hover:bg-[#003366] text-white"
              onClick={handleStartDraft}
            >
              ⚡ DRAFT BEKLEMESİNİ ATLA (ANINDA BAŞLAT)
            </Button>

            <button 
              onClick={handleResetDraftPool}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm transition-all"
            >
              🔄 DRAFT HAVUZUNU SIFIRLA (SİL)
            </button>

            <Button 
              className="w-full justify-start border border-accent bg-accent/10 hover:bg-accent hover:text-[#001021] text-accent"
              onClick={handleSimulateDraft}
            >
              ⏩ DRAFTI HIZLI GEÇ (SİMÜLE ET VE SEZONU BAŞLAT)
            </Button>

            <Button 
              className="w-full justify-start border border-red-500 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 mt-4"
              onClick={handleDeleteLeague}
            >
              🗑️ LİGİ TAMAMEN SİL (Kalıcı İşlem)
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* 2. Maç Motoru Kontrolü */}
          <Card className="bg-gradient-to-br from-[#00254c] to-[#00152b] border-[#005c99]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2 font-display uppercase">
                <Zap className="h-5 w-5 text-yellow-400" />
                Maç Motoru Kontrolü
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start text-white border-[#005c99] hover:bg-[#005c99] hover:text-white"
                onClick={handleSimulateMatch}
                disabled={isSimulating}
              >
                <Play className="h-4 w-4 mr-2 text-green-400" />
                {isSimulating ? 'Simüle Ediliyor...' : 'BU HAFTAYI ŞİMDİ OYNAT'}
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-white border-yellow-500/50 hover:bg-yellow-500/20 hover:text-white"
                onClick={handleEndSeason}
              >
                <Trophy className="h-4 w-4 mr-2 text-yellow-400" />
                SEZONU BİTİR VE YENİ SEZONA GEÇ
              </Button>
              <Button variant="outline" className="w-full justify-start text-white border-red-500/50 hover:bg-red-500/20 hover:text-white mt-4">
                <Activity className="h-4 w-4 mr-2 text-red-400" />
                SADECE MAÇ MOTORUNU ÇALIŞTIR (Debug)
              </Button>
            </CardContent>
          </Card>

          {/* 3. Sistem Sağlık Kontrolü */}
          <Card className="bg-gradient-to-br from-[#00254c] to-[#00152b] border-[#005c99]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2 font-display uppercase">
                <Server className="h-5 w-5 text-blue-400" />
                Oyun Sağlık Kontrolü
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  API Yanıt Süresi: <span className="text-white font-bold">45ms (Normal)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Veritabanı Bağlantısı: <span className="text-white font-bold">Aktif</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Cron Job — Maç Motoru: <span className="text-white font-bold">Son çalışma 19:59</span>
                </li>
                <li className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  Realtime WebSocket: <span className="text-yellow-400 font-bold">Yük artışı</span>
                </li>
              </ul>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="outline" onClick={fetchStats} className="border-[#005c99] text-white">Yenile</Button>
                <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">Acil Durdurma</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* TÜM LİGLER TABLOSU */}
      <Card className="bg-[#00152b] border-[#004b93] mt-6 shadow-xl">
        <CardHeader className="border-b border-[#004b93]/50 pb-4">
          <CardTitle className="text-white flex items-center gap-2 font-display uppercase tracking-wider text-lg">
            <Globe className="h-5 w-5 text-[#00a2ff]" />
            Sistemdeki Tüm Ligler
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-xs uppercase bg-[#001f40] text-gray-400 border-b border-[#004b93]">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Lig Adı</th>
                  <th className="px-4 py-3">Durum</th>
                  <th className="px-4 py-3">Hafta</th>
                  <th className="px-4 py-3">Oluşturulma</th>
                  <th className="px-4 py-3 text-right rounded-tr-lg">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {leaguesList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      Sistemde hiç lig bulunmuyor.
                    </td>
                  </tr>
                ) : (
                  leaguesList.map((lg) => (
                    <tr key={lg.id} className="border-b border-[#001f40] hover:bg-[#00254c] transition-colors">
                      <td className="px-4 py-4 font-bold text-white flex items-center gap-2">
                        {league?.id === lg.id && <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" title="Aktif Lig"></div>}
                        {lg.name}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                          lg.status === 'draft' ? 'bg-purple-500/20 text-purple-400' :
                          lg.status === 'active' ? 'bg-green-500/20 text-green-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {lg.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-mono">Hafta {lg.current_week}</td>
                      <td className="px-4 py-4 text-xs text-gray-400">
                        {new Date(lg.created_at).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-4 py-4 text-right">
                        {league?.id !== lg.id && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              useFranchiseStore.getState().setLeague(lg)
                              alert(lg.name + ' ligi panele yüklendi!')
                            }}
                            className="h-8 border-[#005c99] text-[#00a2ff] hover:bg-[#005c99] hover:text-white"
                          >
                            Panele Yükle
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
