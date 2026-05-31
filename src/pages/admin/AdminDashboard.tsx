import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Shield, Plus, Zap, AlertTriangle, CheckCircle2, Server, Play, FastForward, Activity } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export function AdminDashboard() {
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

  const handleSimulateMatch = async () => {
    const weekInput = prompt("Hangi haftayı simüle etmek istiyorsunuz? (Sayı girin)", "1")
    const week = parseInt(weekInput || "1", 10)
    
    // We need league_id to simulate match. 
    // Usually an Admin selects a league, but here we can prompt or assume the most recent.
    const { data: leagues } = await supabase.from('leagues').select('id').order('created_at', { ascending: false }).limit(1)
    if (!leagues || leagues.length === 0) return alert("Hiç lig bulunamadı!")
    const league_id = leagues[0].id

    setIsSimulating(true)
    try {
      const { data, error } = await supabase.functions.invoke('admin-simulate-match', {
        body: { league_id, week }
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
        
        {/* 1. Lig Kurma */}
        <Card className="bg-gradient-to-br from-[#00254c] to-[#00152b] border-[#005c99]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2 font-display uppercase">
              <Plus className="h-5 w-5 text-accent" />
              Yeni Lig Oluştur (Admin Modu)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs text-text-dim font-bold uppercase mb-1 block">Lig İsmi</label>
              <input 
                type="text" 
                value={leagueName}
                onChange={(e) => setLeagueName(e.target.value)}
                className="w-full bg-[#001021] border border-[#004b93] rounded p-2 text-white" 
                placeholder="Örn: Test_Liga_01" 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs text-text-dim font-bold uppercase block">Mod Seçimi</label>
              <label className="flex items-center gap-2 text-sm text-white bg-white/5 p-2 rounded border border-white/10 cursor-pointer hover:bg-white/10">
                <input type="radio" name="mode" className="accent-accent" />
                Normal Mod — 8 gerçek oyuncu
              </label>
              <label className="flex items-center gap-2 text-sm text-white bg-white/5 p-2 rounded border border-white/10 cursor-pointer hover:bg-white/10">
                <input type="radio" name="mode" className="accent-accent" defaultChecked />
                Test Modu — 1 gerçek oyuncu + 7 bot
              </label>
            </div>

            <div className="bg-[#001021] p-3 rounded border border-yellow-500/30">
              <label className="text-xs text-yellow-500 font-bold uppercase block mb-2">Test Kontrolleri</label>
              <label className="flex items-center gap-2 text-sm text-white mb-2">
                <input type="checkbox" className="accent-accent" defaultChecked />
                2x Kulüp Fonu Başlangıç
              </label>
              <label className="flex items-center gap-2 text-sm text-white">
                <input type="checkbox" className="accent-accent" defaultChecked />
                Maçları Anında Oynat (Zamanı atla)
              </label>
            </div>

            <Button 
              className="w-full osm-button bg-accent"
              onClick={handleCreateLeague}
              disabled={isCreating}
            >
              {isCreating ? 'Lig Kuruluyor...' : 'Botlarla Doldur ve Başlat'}
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
              <Button variant="outline" className="w-full justify-start text-white border-[#005c99] hover:bg-[#005c99] hover:text-white">
                <FastForward className="h-4 w-4 mr-2 text-blue-400" />
                BİR SONRAKİ HAFTAYA ATLA
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
