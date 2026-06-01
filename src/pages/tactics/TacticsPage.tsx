import { useState, useEffect } from 'react'
import { useTactics } from '@/hooks/useTactics'
import { useFranchiseStore } from '@/store/franchiseStore'
import { supabase } from '@/lib/supabase'
import { Shield, Zap, Activity, Crosshair, ShieldAlert, FastForward, Navigation, Search, Flag, Target, BrainCircuit, Clock } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'

export function TacticsPage() {
  const { tactics, isLoading, mutate } = useTactics()
  const { franchise } = useFranchiseStore()
  const [isSaving, setIsSaving] = useState(false)
  const [coaches, setCoaches] = useState<any[]>([])
  
  const [sliders, setSliders] = useState({
    pass_ratio: 50,
    aggression: 50,
    tempo: 50,
    defense_line: 50,
    off_focus: 'short_pass',
    x_rotation: 'ironman',
    x_aggressiveness: 'disciplined',
    x_qb_freedom: 'strict',
    signature_play: 'none',
    signature_condition: 'late_behind',
    challenge_td: true,
    challenge_4th: true,
    q_scripting_4th: 'hold_lead',
    targeted_mismatch: ''
  })

  const [playbook, setPlaybook] = useState({
    offense: {
      first_down: 'play_action',
      second_short: 'power_run',
      second_long: 'short_pass',
      third_short: 'power_run',
      third_long: 'deep_bomb',
      red_zone: 'short_pass',
      goal_line: 'power_run',
      backed_up: 'power_run'
    },
    defense: {
      first_down: 'balanced',
      second_short: 'stop_run',
      second_long: 'pass_def',
      third_short: 'stop_run',
      third_long: 'dime_prevent',
      red_zone: 'red_zone_wall',
      goal_line: 'goal_line_stand',
      backed_up: 'blitz'
    }
  })

  const [fourthDowns, setFourthDowns] = useState({
    fourth_1: 'go',
    fourth_2_3: 'fg',
    fourth_4_6: 'punt',
    fourth_7_plus: 'punt',
    fourth_goal: 'go'
  })

  useEffect(() => {
    if (tactics?.slider_ayarlari) {
      setSliders(prev => ({ ...prev, ...(tactics.slider_ayarlari as any) }))
      if ((tactics.slider_ayarlari as any)?.fourth_downs) {
        setFourthDowns((tactics.slider_ayarlari as any).fourth_downs)
      }
      if ((tactics.slider_ayarlari as any)?.playbook) {
        setPlaybook((tactics.slider_ayarlari as any).playbook)
      }
    }
  }, [tactics])

  useEffect(() => {
    const fetchCoaches = async () => {
      if (!franchise) return
      const { data } = await supabase.from('coaches').select('*').eq('franchise_id', franchise.id)
      if (data) setCoaches(data)
    }
    fetchCoaches()
  }, [franchise])

  if (isLoading) return (
    <div className="space-y-4 pt-4 max-w-4xl mx-auto">
      <Skeleton className="h-12 w-full bg-white/5" />
      <Skeleton className="h-[400px] w-full bg-white/5" />
    </div>
  )

  const handleSave = async () => {
    if (!franchise) return
    setIsSaving(true)
    
    const finalSliders = { ...sliders, fourth_downs: fourthDowns, playbook }

    try {
      if (tactics?.id === 'new') {
        const { error } = await supabase.from('tactics').insert({
          franchise_id: franchise.id,
          slider_ayarlari: finalSliders,
          paketler: []
        })
        if (error) throw error
      } else {
        const { error } = await supabase.from('tactics').update({
          slider_ayarlari: finalSliders
        }).eq('franchise_id', franchise.id)
        if (error) throw error
      }
      mutate()
      alert('Taktikler başarıyla kaydedildi!')
    } catch (err: any) {
      alert('Hata: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const sliderConfig = [
    { key: 'pass_ratio', label: 'Oyun Tarzı', minLabel: 'Run Heavy', maxLabel: 'Pass Heavy', icon: Crosshair, color: 'text-blue-400', bg: 'bg-blue-500' },
    { key: 'aggression', label: 'Mücadele Sertliği', minLabel: 'Dikkatli', maxLabel: 'Agresif', icon: Zap, color: 'text-red-400', bg: 'bg-red-500' },
    { key: 'tempo', label: 'Oyun Temposu', minLabel: 'Yavaş', maxLabel: 'Hızlı Hücum', icon: FastForward, color: 'text-accent', bg: 'bg-accent' },
    { key: 'defense_line', label: 'Savunma Çizgisi', minLabel: 'Geride Bekle', maxLabel: 'Önde Baskı', icon: ShieldAlert, color: 'text-green-400', bg: 'bg-green-500' }
  ]

  const fourthDownConfig = [
    { key: 'fourth_1', label: '4th & 1 (Her yer)' },
    { key: 'fourth_2_3', label: '4th & 2-3 (Rakip yarısı)' },
    { key: 'fourth_4_6', label: '4th & 4-6 (Orta saha)' },
    { key: 'fourth_7_plus', label: '4th & 7+ (Kendi yarısı)' },
    { key: 'fourth_goal', label: '4th & Goal (Kırmızı bölge)' }
  ]

  return (
    <div className="space-y-6 pt-4 max-w-4xl mx-auto pb-20 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 bg-[#00152b]/80 p-4 rounded-xl border border-[#005c99]/30">
        <Activity className="h-8 w-8 text-accent" />
        <div>
          <h1 className="text-xl font-display font-bold text-white tracking-wider">COACH'S CLIPBOARD</h1>
          <p className="text-white/60 text-xs font-bold uppercase">Maç öncesi stratejinizi belirleyin</p>
        </div>
      </div>

      {coaches.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {coaches.map(coach => (
            <div key={coach.id} className="bg-gradient-to-r from-[#00152b] to-[#001021] p-4 rounded-xl border border-white/10 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-display font-black text-xl ${
                coach.type === 'offensive' ? 'bg-blue-500/20 text-blue-400 border-blue-500' : 'bg-green-500/20 text-green-400 border-green-500'
              } border`}>
                {coach.prediction_rating}
              </div>
              <div>
                <div className="text-xs font-bold text-white/50 uppercase tracking-widest">
                  {coach.type === 'offensive' ? 'Hücum Koçu (OC)' : 'Savunma Koçu (DC)'}
                </div>
                <div className="text-white font-bold text-lg leading-tight">{coach.name}</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {coach.traits?.map((t: string) => (
                    <span key={t} className="text-[9px] uppercase font-bold text-white/70 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-6">
        
        {/* Mismatch Scout Report */}
        <div className="bg-gradient-to-r from-[#00254c] to-[#00152b] p-5 rounded-xl border border-[#004b93]/50">
          <h2 className="text-sm font-display font-bold text-accent uppercase mb-6 flex items-center gap-2">
            <Search className="w-4 h-4" /> Rakip İstihbarat Raporu (Scout Report)
          </h2>
          <div className="bg-[#001021] border border-white/10 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/10">
              <span className="text-xs font-bold text-white/50">Haftanın Hakemi: <span className="text-white">Mike Thomas (KATI)</span></span>
              <span className="text-xs font-bold text-white/50">Hava Durumu: <span className="text-white">☁️ Bulutlu</span></span>
            </div>
            <p className="text-xs text-white/70 mb-4">⚠️ MİSMATCH FIRSATLARI (Haftada 1 adet seçilebilir):</p>
            <div className="space-y-3">
              {[
                { id: 'mismatch_1', label: 'WR1 vs DB2', advantage: '+12 OVR Avantajı' },
                { id: 'mismatch_2', label: 'TE1 vs LB3', advantage: '+8 OVR Avantajı' }
              ].map((m, idx) => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold">{idx + 1}</div>
                    <div>
                      <div className="text-white font-bold text-sm">{m.label}</div>
                      <div className="text-green-400 text-xs font-bold">{m.advantage}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSliders({...sliders, targeted_mismatch: m.id})}
                    className={`px-4 py-2 rounded text-xs font-bold uppercase transition-colors ${
                      sliders.targeted_mismatch === m.id ? 'bg-accent text-[#001021]' : 'bg-black/40 text-white hover:bg-white/10 border border-white/20'
                    }`}
                  >
                    {sliders.targeted_mismatch === m.id ? '🎯 HEDEFLENDİ' : '🎯 HEDEFLE'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Situational Matrix (Play Call Sheet) */}
        <div className="bg-gradient-to-r from-[#00254c] to-[#00152b] p-5 rounded-xl border border-[#004b93]/50">
          <h2 className="text-sm font-display font-bold text-accent uppercase mb-6 flex items-center gap-2">
            <Target className="w-4 h-4" /> Durumsal Oyun Planı (Play Call Sheet)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="py-3 px-2 text-xs text-white/50 uppercase font-bold w-1/3">Durum</th>
                  <th className="py-3 px-2 text-xs text-blue-400 uppercase font-bold w-1/3">Hücum Tercihi</th>
                  <th className="py-3 px-2 text-xs text-green-400 uppercase font-bold w-1/3">Savunma Tercihi</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { key: 'first_down', label: '1. Hak (Tüm Sahada)' },
                  { key: 'second_short', label: '2. Hak & Kısa (1-3 Yd)' },
                  { key: 'second_long', label: '2. Hak & Uzun (7+ Yd)' },
                  { key: 'third_short', label: '3. Hak & Kısa (Kritik)' },
                  { key: 'third_long', label: '3. Hak & Uzun (Kritik)' },
                  { key: 'red_zone', label: 'Kırmızı Bölge (Rakip 20 Yd İçi)' },
                  { key: 'goal_line', label: 'Gol Çizgisi (Rakip 5 Yd İçi)' },
                  { key: 'backed_up', label: 'Sıkışık Durum (Kendi 10 Yd İçi)' },
                ].map((row, idx) => (
                  <tr key={row.key} className={`border-b border-white/5 ${idx % 2 === 0 ? 'bg-white/5' : ''}`}>
                    <td className="py-3 px-2 text-xs font-bold text-white uppercase">{row.label}</td>
                    <td className="py-3 px-2">
                      <select 
                        value={(playbook.offense as any)[row.key]}
                        onChange={(e) => setPlaybook({ ...playbook, offense: { ...playbook.offense, [row.key]: e.target.value }})}
                        className="w-full bg-[#001021] text-xs font-bold text-white border border-white/10 rounded p-2 focus:border-accent"
                      >
                        <option value="power_run">Ağır Koşu (İçeriden)</option>
                        <option value="outside_run">Dışarıdan Koşu</option>
                        <option value="play_action">Play-Action (Sürpriz Pas)</option>
                        <option value="short_pass">Kısa & Güvenli Pas</option>
                        <option value="screen_pass">Screen Pas</option>
                        <option value="deep_bomb">Derin Bomba</option>
                        <option value="qb_scramble">QB Scramble</option>
                      </select>
                    </td>
                    <td className="py-3 px-2">
                      <select 
                        value={(playbook.defense as any)[row.key]}
                        onChange={(e) => setPlaybook({ ...playbook, defense: { ...playbook.defense, [row.key]: e.target.value }})}
                        className="w-full bg-[#001021] text-xs font-bold text-white border border-white/10 rounded p-2 focus:border-green-500"
                      >
                        <option value="stop_run">Kutuyu Doldur (Koşu Sav.)</option>
                        <option value="pass_def">Alan Savunması (Zone)</option>
                        <option value="man_coverage">Adam Adama (Man)</option>
                        <option value="blitz">Agresif Baskı (Blitz)</option>
                        <option value="dime_prevent">Dime/Prevent (Uzun Pas Koruma)</option>
                        <option value="red_zone_wall">Kırmızı Bölge Duvarı</option>
                        <option value="goal_line_stand">Ağır Çizgi Savunması</option>
                        <option value="balanced">Dengeli</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-white/40 mt-4 leading-relaxed">
            * Oyun motoru sahadaki konuma (Yard Line) ve Mesafe/Hak durumuna göre yukarıdaki matristen eşleşen taktiği seçer. 
            Menajerin Slider (Temel Felsefe) ayarları bu taktiklerin genel katsayılarını ve oyuncuların agresifliğini modifiye eder.
          </p>
        </div>

        {/* Takım Karakteri (X-Factors) */}
        <div className="bg-gradient-to-r from-[#00254c] to-[#00152b] p-5 rounded-xl border border-[#004b93]/50">
          <h2 className="text-sm font-display font-bold text-accent uppercase mb-6 flex items-center gap-2">
            <BrainCircuit className="w-4 h-4" /> Takım Karakteri & Disiplin (X-Factors)
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-[#001021] p-4 rounded-lg border border-white/5">
              <div className="text-[10px] font-bold text-white/50 uppercase mb-3">Rotasyon Anlayışı</div>
              <select value={sliders.x_rotation} onChange={e => setSliders({...sliders, x_rotation: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-xs text-white">
                <option value="ironman">Demir Adamlar (Aslar Yorulana Kadar)</option>
                <option value="frequent">Sık Rotasyon (Yedekler Sürekli Girer)</option>
              </select>
            </div>
            <div className="bg-[#001021] p-4 rounded-lg border border-white/5">
              <div className="text-[10px] font-bold text-white/50 uppercase mb-3">Agresiflik</div>
              <select value={sliders.x_aggressiveness} onChange={e => setSliders({...sliders, x_aggressiveness: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-xs text-white">
                <option value="disciplined">Disiplinli (Az Ceza)</option>
                <option value="physical">Fiziksel Oyna (Çok Ceza Riski)</option>
              </select>
            </div>
            <div className="bg-[#001021] p-4 rounded-lg border border-white/5">
              <div className="text-[10px] font-bold text-white/50 uppercase mb-3">QB Özgürlüğü</div>
              <select value={sliders.x_qb_freedom} onChange={e => setSliders({...sliders, x_qb_freedom: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-xs text-white">
                <option value="strict">Taktikten Şaşma</option>
                <option value="audible">Doğaçlama Serbest (Audible)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Signature Play & Challenge Flag */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-r from-[#00254c] to-[#00152b] p-5 rounded-xl border border-[#004b93]/50">
            <h2 className="text-sm font-display font-bold text-accent uppercase mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" /> Signature Play (Sezonluk Koz)
            </h2>
            <div className="space-y-4">
              <div>
                <div className="text-[10px] text-white/50 mb-1">Sezonda 1 kere kullanılacak özel oyun (100 Coin)</div>
                <select value={sliders.signature_play} onChange={e => setSliders({...sliders, signature_play: e.target.value})} className="w-full bg-black/40 border border-yellow-500/30 text-yellow-100 rounded p-2 text-xs">
                  <option value="none">Seçilmedi</option>
                  <option value="hail_mary">Hail Mary Pass (+25% TD şansı, yüksek INT riski)</option>
                  <option value="fake_punt">Fake Punt (Sürpriz 4th Down denemesi)</option>
                  <option value="goal_line_stand">Goal Line Stand (Kırmızı Bölgede Duvar Ol)</option>
                </select>
              </div>
              {sliders.signature_play !== 'none' && (
                <div>
                  <div className="text-[10px] text-white/50 mb-1">Otomatik Tetiklenme Şartı</div>
                  <select value={sliders.signature_condition} onChange={e => setSliders({...sliders, signature_condition: e.target.value})} className="w-full bg-black/40 border border-white/10 text-white rounded p-2 text-xs">
                    <option value="late_behind">Son 2 dakika gerideysem</option>
                    <option value="red_zone">Kırmızı bölgeye girildiğinde</option>
                    <option value="always">Şartlar oluştuğu ilk an kullan</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#00254c] to-[#00152b] p-5 rounded-xl border border-[#004b93]/50">
            <h2 className="text-sm font-display font-bold text-accent uppercase mb-4 flex items-center gap-2">
              <Flag className="w-4 h-4 text-red-500" /> Challenge Flag (İtiraz)
            </h2>
            <div className="space-y-3">
              <div className="text-[10px] text-white/50">Maç başına 1 itiraz hakkı motor tarafından otomatik kullanılır. Hangi durumlarda kullanılsın?</div>
              <label className="flex items-center gap-3 bg-[#001021] p-3 rounded border border-white/5 cursor-pointer hover:border-white/20">
                <input type="checkbox" checked={sliders.challenge_td} onChange={e => setSliders({...sliders, challenge_td: e.target.checked})} className="accent-red-500" />
                <span className="text-xs text-white">Tartışmalı Touchdown kararlarında (Son 2 dk)</span>
              </label>
              <label className="flex items-center gap-3 bg-[#001021] p-3 rounded border border-white/5 cursor-pointer hover:border-white/20">
                <input type="checkbox" checked={sliders.challenge_4th} onChange={e => setSliders({...sliders, challenge_4th: e.target.checked})} className="accent-red-500" />
                <span className="text-xs text-white">4th Down yer kazanımı itirazları</span>
              </label>
            </div>
          </div>
        </div>

        {/* Çeyrek Scripting */}
        <div className="bg-gradient-to-r from-[#00254c] to-[#00152b] p-5 rounded-xl border border-[#004b93]/50">
          <h2 className="text-sm font-display font-bold text-accent uppercase mb-6 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Çeyrek Senaryoları (Quarter Scripting)
          </h2>
          <div className="bg-[#001021] p-4 rounded-lg border border-white/5">
            <div className="text-[10px] font-bold text-white/50 uppercase mb-3">4. Çeyrek Stratejisi</div>
            <select value={sliders.q_scripting_4th} onChange={e => setSliders({...sliders, q_scripting_4th: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-xs text-white">
              <option value="hold_lead">Skoru Koru (Öndeysek tempoyu düşür, savunmayı geriye çek)</option>
              <option value="aggressive">Ne Olursa Olsun Saldır (Skora bakmaksızın agresif pas oyna)</option>
              <option value="balanced">Temel Felsefeden Şaşma (Skor ne olursa olsun aynı taktiğe devam et)</option>
            </select>
          </div>
        </div>

        {/* Sliders */}
        <div className="bg-gradient-to-r from-[#00254c] to-[#00152b] p-5 rounded-xl border border-[#004b93]/50">
          <h2 className="text-sm font-display font-bold text-accent uppercase mb-6 flex items-center gap-2">
            <Shield className="w-4 h-4" /> Temel Felsefe Ayarları
          </h2>
          <div className="space-y-8">
            {sliderConfig.map((config) => {
              const value = (sliders as any)[config.key]
              const Icon = config.icon
              
              return (
                <div key={config.key}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-5 h-5 ${config.color}`} />
                      <span className="text-white font-bold uppercase tracking-wide text-sm">{config.label}</span>
                    </div>
                    <div className={`px-3 py-1 rounded bg-black/40 border border-[#005c99] text-white font-display font-bold text-lg`}>
                      {value}
                    </div>
                  </div>
                  
                  <div className="relative pt-2 pb-2">
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={value}
                      onChange={(e) => setSliders({...sliders, [config.key]: parseInt(e.target.value)})}
                      className="w-full h-2 bg-[#001021] rounded-lg appearance-none cursor-pointer"
                      style={{ background: `linear-gradient(to right, var(--color-accent) 0%, var(--color-accent) ${value}%, #001021 ${value}%, #001021 100%)` }}
                    />
                    <div className="flex justify-between text-[10px] font-bold text-white/50 uppercase tracking-wider mt-2">
                      <span>{config.minLabel}</span>
                      <span>Dengeli</span>
                      <span>{config.maxLabel}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 4th Down Karar Tahtası */}
        <div className="bg-gradient-to-r from-[#00254c] to-[#00152b] p-5 rounded-xl border border-[#004b93]/50">
          <h2 className="text-sm font-display font-bold text-accent uppercase mb-6 flex items-center gap-2">
            <Navigation className="w-4 h-4" /> 4th Down Karar Tahtası
          </h2>
          <div className="space-y-4">
            {fourthDownConfig.map(config => (
              <div key={config.key} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-3 bg-[#001021] rounded border border-white/5">
                <span className="text-xs font-bold text-white uppercase">{config.label}</span>
                <div className="flex gap-2">
                  {[{ val: 'go', label: 'GO FOR IT' }, { val: 'punt', label: 'PUNT' }, { val: 'fg', label: 'FG' }].map(opt => (
                    <button
                      key={opt.val}
                      onClick={() => setFourthDowns({ ...fourthDowns, [config.key]: opt.val })}
                      className={`px-3 py-1.5 rounded text-xs font-bold uppercase transition-colors ${
                        (fourthDowns as any)[config.key] === opt.val ? 'bg-accent text-[#001021] border border-accent' : 'bg-black/40 text-white/50 border border-white/10 hover:border-white/30 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      <button onClick={handleSave} disabled={isSaving} className="w-full osm-button bg-green-600 hover:bg-green-500 mt-8 py-4 text-lg">
        {isSaving ? 'KAYDEDİLİYOR...' : 'TAKTİKLERİ KAYDET'}
      </button>
    </div>
  )
}
