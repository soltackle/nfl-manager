import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Shield, Plus, Zap, AlertTriangle, CheckCircle2, Server, Play, FastForward, Activity } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useFranchiseStore } from '@/store/franchiseStore'

export function AdminDashboard() {
  const { league } = useFranchiseStore()
  const [isSimulating, setIsSimulating] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [leagueName, setLeagueName] = useState('')

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

      // Generate draft pool (free agent players) if not exists
      const { data: poolPlayers } = await supabase
        .from('players')
        .select('id')
        .eq('league_id', league.id)
        .is('franchise_id', null)
        .limit(1)

      if (!poolPlayers || poolPlayers.length === 0) {
        // Create a draft pool of ~100 free agents for this league
        const positions = ['QB', 'RB', 'WR', 'TE', 'OL', 'DE', 'LB', 'CB', 'S', 'K']
        const poolInsert = []
        for (let i = 0; i < 100; i++) {
          poolInsert.push({
            name: `FA Player ${i + 1}`,
            position: positions[i % positions.length],
            overall: 55 + Math.floor(Math.random() * 35),
            value: 50000 + Math.floor(Math.random() * 500000),
            franchise_id: null,
            league_id: league.id
          })
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

  return (
    <div className="space-y-6 pt-4 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-8 bg-[#00152b]/80 p-4 rounded-xl border border-red-500/30">
        <Shield className="h-10 w-10 text-red-500" />
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-wider">ADMIN KONTROL MERKEZİ</h1>
          <p className="text-red-400 text-sm font-bold">Yüksek Yetki Seviyesi Aktif</p>
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
              <Button variant="outline" className="w-full justify-start text-white border-red-500/50 hover:bg-red-500/20 hover:text-white">
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
                <Button size="sm" variant="outline" className="border-[#005c99] text-white">Yenile</Button>
                <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">Acil Durdurma</Button>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
