import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SPIKER_METINLERI = {
  "KISA_PAS_BASARILI": [
    "Pocket darmadağın olmadan [TEAM] pasörü buttonhook'a gözü kapalı topu bıraktı! [YARDS] yarda, hassas cerrahi gibi bir hamle!",
    "Tribünler titriyor! [TEAM] oyun kurucusu üçüncü alıcı açıktı, buldu! Out route'a tereyağı gibi işleyen bir pas — [YARDS] yarda kazanç!",
    "[TEAM] shotgun'dan snap aldı, sol tarafa döndü ve checkdown'ı gördü! Koşucu topu kaptı, ilerliyor, [YARDS] yarda bitiriyor!",
    "Savunma blitz göndermişti ama [TEAM] buna hazırdı! Hot route devreye girdi, hızlı release — [YARDS] yardalık zekice bir karar!",
    "Kısa ama altın değerinde! [TEAM] oyun kurucusu 3. hakta drag route'daki alıcısını buldu! [YARDS] yarda, first down için yeterli!"
  ],
  "DERIN_BOMBA_BASARILI": [
    "BOMBA! [TEAM] oyun kurucusu kanal gibi bir geçit buldu ve gözünü kırpmadan post route'a fırlattı! [YARDS] yarda, tam isabetle!",
    "Ay ışığında bir ok gibi süzüldü o top! [TEAM]'in alıcısı iki defender arasından sıyrılıp havadan kaptı! [YARDS] yarda unutulmaz bir play!",
    "Ses dalgaları tribünlerde çarpışıyor! [TEAM] oyun kurucusu scramble'dan çıkıp go route'a fişeği ateşledi! [YARDS] yarda — inanılması güç!",
    "Tek ayak üzerinde, çizginin tam içinde yakaladı! [TEAM] alıcısı sideline'da mucize gösterdi! [YARDS] yardalık kaya gibi sağlam bir play!",
    "Pocket'te çelik gibi direndi, savunma etrafında döndü ve son anda fırlattı! [YARDS] yarda HARIKA bir hedef [TEAM] için!"
  ],
  "ICERIDEN_SERT_KOSU": [
    "İki lineman arasındaki boşluktan bir parmak genişliği bile yok ama [TEAM] koşucusu bir şekilde içeri daldı! [YARDS] yarda zorla kopardı!",
    "[TEAM] fullback önde açıyor yolu, koşucu arkasından geliyor! Kask kaska, omuz omuza — ve [YARDS] yarda çıktı bu karanlık tünelden!",
    "Güneş batarken saha kızıla boyandı, ama [TEAM] koşucusu için tek renk var: ileri! [YARDS] yarda, bir santim dahi olsa ileri!",
    "[TEAM] hücum hattı kapı gibi açtı yolu ama savunma çabuk kapandı! [YARDS] yarda ancak kazanılabildi, bu trenches savaşı tam anlamıyla!",
    "Saat ilerliyor, yağmur çiseliyor ve [TEAM] yine aynı oyunu oynuyor! Güce güç! Koşucu kafasını kaldırmadan ilerliyor — [YARDS] yarda!"
  ],
  "DISARIDAN_KOSU_BASARILI": [
    "[TEAM] koşucusu sağ çizgiye saptı, defender önde bekliyordu ama juke o kadar keskin ki adam yerinde dondu! [YARDS] yarda tam gaz!",
    "Toss play! [TEAM] sahayı bir yana kaydırdı, blokerlar yolu temizledi ve koşucu açık alana döküldü! [YARDS] yarda harika bir çalışma!",
    "İzle şu ellerini, izle şu ayaklarını! [TEAM] koşucusu bir değil, iki defender'ı geçti ve [YARDS] yarda zihin açıcı bir play sergiledi!",
    "Saha dışındaki kalabalık dahi tutamadı nefesini! [TEAM] koşucusu end around'dan döktü kendini ve [YARDS] yarda çıkardı bu oyundan!",
    "Cornerback hazırdı ama [TEAM]'in hız roketi onu çoktan geçmişti bile! [YARDS] yarda — kimse tutamadı onu!"
  ],
  "INCOMPLETE_PASS": [
    "Pocket hızla daralıyor! [TEAM] pasörü paniklemeden topu fırlattı ama o top hep yüksekte gidecekti. Incomplete pass.",
    "[TEAM] deep route'a gitti ama savunma zone coverage'la tüm alanı kapatmıştı! Pas gidecek yer bulamadı, zemine iniyor. Incomplete.",
    "İki alıcı için çizilmiş bir rota ama ikisi de kapalıydı! [TEAM] oyun kurucusu gecikti, sıkıştı ve top boşluğa gitti. Incomplete.",
    "Sert bir blitz rush altında [TEAM] pasörünün kolu tam kalkamamıştı! Top sağa saparak sideline'ın dışına çıktı. Incomplete pass!",
    "Throwaway kararı! Pocket çöküyordu, [TEAM] pasörü topu saha dışına attı. Akıllıca bir güvenlik tercihi ama yine de incomplete."
  ],
  "SACK": [
    "Üçlü blitz baskısı! [TEAM] oyun kurucusunun sağ tarafı çöktü ve içeriden gelen defender dümdüz yere serdi! [YARDS] yarda kayıp! SACK!",
    "Hem sağda hem solda kapı kapandı! [TEAM] pasörü scramble'a çalıştı ama şimdi zeminde yatıyor! [YARDS] yarda geri gitti! SACK!",
    "Edge rusher rüzgar gibi köşeyi döndü! [TEAM] sağ tackle hiçbir şey yapamadı! Oyun kurucusu yere çakıldı! [YARDS] yarda kayıp! SACK!",
    "Kar yağışı altında saha bembeyaz ama [TEAM] pasörünün hayali kara döndü! Defender omuzundan yakaladı ve savurdu! [YARDS] yarda kayıp! SACK!",
    "İki saniye içinde pocket yok oldu! [TEAM] oyun kurucusu topu elinde tutmak zorunda kaldı... ve büyük bedel ödedi! [YARDS] yarda kayıp! SACK!"
  ],
  "INTERCEPTION": [
    "[TEAM] red zone'da riske girdi! Pas atıldı... ama savunma linebacker'ı rotayı ezbere biliyordu sanki! Atladı, kaptı! INTERCEPTION!",
    "Rüzgar bu kez [TEAM]'in aleyhine esti! Pas saptı, hedeflenen alıcıya gitmedi — karşı takımın safety'si kapıştı! INTERCEPTION!",
    "Tüm saha dondu! [TEAM] pasörü presre aldandı, erken fırlattı topu... ve cornerback tam önünden geçerken kaptı! INTERCEPTION!",
    "Bu maçın dönüm noktası olabilir! [TEAM] oyun kurucusu route'u yanlış okudu, alıcı iç tarafa keserken pas dış tarafa gitti! INTERCEPTION!",
    "Taraftarlar şoku yaşıyor! [TEAM]'in pasörü endzone'a atış yaptı ama savunma hazırdı, konuşlanmıştı, bekliyordu! INTERCEPTION! Büyük kayıp!"
  ],
  "FUMBLE": [
    "[TEAM] koşucusu ikinci hedefe koşarken defender tam bilekten yakaladı! Top havaya uçtu! FUMBLE! Ve kaos başlıyor!",
    "Snap exchange bozuldu! [TEAM] merkezi topu düzgün aktaramadı, oyun kurucusu kaybetti tutmayı! FUMBLE! Yer yarılıyor sanki!",
    "Hava soğuk, eller uyuşmuş! [TEAM] alıcısı yakaladıktan sonra topu tutamadı! FUMBLE! Top zeminde yuvarlanıyor!",
    "[TEAM] koçu görmek istemedi bunu! Koşucu tek elinde taşırken linebacker tam kasığa vurdu! FUMBLE! Ve savunma fırsatı kaptı!",
    "Hit öyle bir hit ki... [TEAM]'in oyun kurucusu havaya kalktı ve top da ondan önce zemine indi! FUMBLE! İnanılmaz güç!"
  ],
  "TOUCHDOWN": [
    "BU NASIL BİR YAKALAYIŞ?! [TEAM] alıcısı tek bacağıyla çizgide, topu göğsüne bastırmış şekilde düşüyor! TOUCHDOWN!!! 6 sayı!",
    "[TEAM] koşucusu son üç defender'ı devirdi, hiçbiri tutamadı onu! TOUCHDOWN!!! Stadyumun çatısı uçuyor! 6 sayı!",
    "Her hafta bu sahaya çıkıyorlar işte bunun için! [TEAM] endzone'a girdi! TOUCHDOWNNNNN!!! Bu tarihi bir an! 6 sayı!",
    "Gece çöküyor üzerimize ama saha aydınlıktan geçmiyor! [TEAM] pasörü scramble'dan çıkıp endzone'a koştu! TOUCHDOWN!!! 6 sayı!",
    "Kalabalığın çığlığı gökyüzüne yükseliyor! [TEAM] topu son çizginin ötesine taşıdı! TOUCHDOWN!!! Herkese hayırlı olsun — 6 sayı!"
  ],
  "FIELD_GOAL_ISABETLI": [
    "Özel takım sahada! [TEAM] vurucusu [YARDS] yarda için hazırlandı... snap, hold, vuruş... GOOD! DİREKLERİN ARASINDA! FIELD GOAL! 3 sayı!",
    "Rüzgara rağmen [TEAM] vurucusu cesur bir kararla topa vurdu! [YARDS] yarda... top sallanıyor... ve GEÇİYOR! FIELD GOAL! 3 sayı!",
    "Gecenin karanlığında saha ışıkları [TEAM] vurucusunu aydınlıyor... [YARDS] yardalık kritik deneme... GOOD! FIELD GOAL! 3 sayı!",
    "[YARDS] yardalık deneme! [TEAM] vurucusu terlemeden yaklaştı topa... salladı! TOP GEÇİYOR! FIELD GOAL! 3 sayı!",
    "Maçın kritik anında [TEAM] özel takımı sahada! [YARDS] yarda... snap temiz, vuruş güzel — GOOD! FIELD GOAL! 3 sayı!"
  ],
  "FIELD_GOAL_KACTI": [
    "[TEAM] vurucusu [YARDS] yarda için hazırlandı ama bacağı kaymış olabilir mi? Top sol direğin dışına çıkıyor! NO GOOD! Field Goal kaçtı!",
    "Snap biraz sola geldi, hold düzeltemedi! [TEAM]'in [YARDS] yardalık denemesi düzensiz gitti... NO GOOD! Kaçan field goal!",
    "[YARDS] yarda bu hava şartlarında mı? [TEAM] vurucusu çok şey istedi kendinden, top kısa kaldı! NO GOOD! Field Goal yok!",
    "[TEAM] vurucusu [YARDS] yardalık denemede ayağını erken kaldırdı! Top sağa saptı, direği dışarıdan geçti! NO GOOD! Kaçan şans!",
    "Her şey hazırdı ama [TEAM] için kader yoktu! [YARDS] yardalık deneme direğin tam üzerinden atlayamadı! NO GOOD! Field Goal kaçtı!"
  ],
  "TURNOVER_ON_DOWNS": [
    "Drama son hakkında! [TEAM] cesaret gösterdi ama savunma daha cesurdu! Çizgi geçilemiyor! Turnover on Downs! Top rakibinde!",
    "Bütün kartlarını ortaya koydu [TEAM]! Ama savunma her hareketi okudu ve kapandı! Turnover on Downs! Büyük hayal kırıklığı!",
    "First down için tek yarda! Tek YARDA! Ama [TEAM] koşucusu savunma duvarında eridi! Turnover on Downs! Acı son!",
    "Saha suskunlaştı... [TEAM]'in hücum hattı itiyordu... savunma itiyordu... ve savunma kazandı! Turnover on Downs!",
    "[TEAM] pasörü 4. Hakta derin rotayı denedi — riskli karardı, pas incomplete! Turnover on Downs! Top rakibine geçiyor!"
  ],
  "NO_GAIN": [
    "Savunma hattı beton gibi! [TEAM] hücumu içeri daldı ama hiçbir şey çıkaramadı. 0 yarda kazanç.",
    "[TEAM] için oyun anında bozuldu, line of scrimmage'da büyük bir yığılma var! Kazanç yok.",
    "Pas atacak kimse yok! [TEAM] oyun kurucusu çizgiye doğru kaçtı ama hemen indirildi. Sadece 0 yarda.",
    "Koşucu topu aldığı gibi karşısında üç defender buldu! [TEAM] milim bile ilerleyemiyor.",
    "Harika bir savunma okuması! [TEAM]'in denediği trick play tamamen duvara çarptı. 0 yarda."
  ]
}

const getRandomLog = (category: keyof typeof SPIKER_METINLERI, team: string, yards: number = 0) => {
  const options = SPIKER_METINLERI[category]
  if (!options) return ""
  const selected = options[Math.floor(Math.random() * options.length)]
  return selected.replace(/\[TEAM\]/g, team).replace(/\[YARDS\]/g, Math.abs(yards).toString())
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Auth Header')
    
    const internalSecret = req.headers.get('X-Internal-Secret')
    const isServiceRole = internalSecret === Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') && internalSecret !== null
    const token = authHeader.replace('Bearer ', '')

    if (!isServiceRole) {
      const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
      if (userError) throw new Error('admin-simulate-match AuthError: ' + userError.message)
      if (!user) throw new Error('admin-simulate-match Invalid token: No User')

      // Verify admin
      const { data: dbUser } = await supabaseAdmin.from('users').select('role').eq('id', user.id).single()
      if (!dbUser || dbUser.role !== 'admin') throw new Error('admin-simulate-match Unauthorized: Not an admin')
    }

    const { league_id, week } = await req.json()

    const { data: matches, error: matchErr } = await supabaseAdmin
      .from('matches')
      .select('*, home_franchise_id, away_franchise_id')
      .eq('league_id', league_id)
      .eq('week', week)

    if (matchErr || !matches) throw new Error('Matches not found')

    for (const match of matches) {
      if (match.final_stats?.played) continue

      const { data: homePlayers } = await supabaseAdmin.from('players').select('overall, traits, position').eq('franchise_id', match.home_franchise_id)
      const { data: awayPlayers } = await supabaseAdmin.from('players').select('overall, traits, position').eq('franchise_id', match.away_franchise_id)
      
      const { data: homeCoaches } = await supabaseAdmin.from('coaches').select('*').eq('franchise_id', match.home_franchise_id)
      const { data: awayCoaches } = await supabaseAdmin.from('coaches').select('*').eq('franchise_id', match.away_franchise_id)
      
      const getTeamPower = (players: any[]) => {
        if (!players || players.length === 0) return 50
        const sorted = players.sort((a, b) => b.overall - a.overall).slice(0, 11)
        return sorted.reduce((sum, p) => sum + p.overall, 0) / sorted.length
      }

      let homePower = getTeamPower(homePlayers)
      let awayPower = getTeamPower(awayPlayers)

      const hasTrait = (team: 'home' | 'away', pos: string, trait: string) => {
        const pList = team === 'home' ? homePlayers : awayPlayers
        if (!pList) return false
        return pList.some(p => p.position.includes(pos) && p.traits && p.traits.includes(trait))
      }

      const { data: homeTacData } = await supabaseAdmin.from('tactics').select('slider_ayarlari').eq('franchise_id', match.home_franchise_id).single()
      const { data: awayTacData } = await supabaseAdmin.from('tactics').select('slider_ayarlari').eq('franchise_id', match.away_franchise_id).single()
      
      const homeTac = (homeTacData?.slider_ayarlari || {}) as any
      const awayTac = (awayTacData?.slider_ayarlari || {}) as any

      const { data: stadium } = await supabaseAdmin.from('stadiums').select('turf_level').eq('franchise_id', match.home_franchise_id).single()
      if (stadium) {
        if (stadium.turf_level === 1) homePower *= 1.02
        if (stadium.turf_level === 2) homePower *= 1.04
        if (stadium.turf_level === 3) homePower *= 1.06
      }

      if (homeTac.x_aggressiveness === 'physical') homePower += 2
      if (awayTac.x_aggressiveness === 'physical') awayPower += 2
      if (homeTac.x_rotation === 'ironman') homePower += 2
      if (awayTac.x_rotation === 'ironman') awayPower += 2

      let homeScore = 0
      let awayScore = 0
      let possession = 'home'
      let yardLine = 25
      let down = 1
      let distance = 10
      let quarter = 1
      let playInQuarter = 0
      const maxPlaysPerQuarter = 25
      const logs: any[] = []

      const addLog = (time: string, text: string, playType: string, event: string | null = null, endYard: number = yardLine) => {
        logs.push({
          time,
          text,
          possession,
          startYard: yardLine,
          endYard,
          playType,
          event
        })
      }

      addLog("BAŞLANGIÇ", "Maç başladı! İlk hücum hakkı Ev Sahibi'nde.", "kickoff", null, 25)

      const switchPossession = (isKickoff = false) => {
        possession = possession === 'home' ? 'away' : 'home'
        yardLine = isKickoff ? 25 : 100 - yardLine
        if (yardLine <= 0) yardLine = 20
        if (yardLine >= 100) yardLine = 99
        down = 1
        distance = 10
      }

      for (let totalPlays = 0; totalPlays < maxPlaysPerQuarter * 4; totalPlays++) {
        quarter = Math.floor(totalPlays / maxPlaysPerQuarter) + 1
        playInQuarter = totalPlays % maxPlaysPerQuarter

        const offTac = possession === 'home' ? homeTac : awayTac
        const defTac = possession === 'home' ? awayTac : homeTac
        const offPower = possession === 'home' ? homePower : awayPower
        const defPower = possession === 'home' ? awayPower : homePower

        const teamName = possession === 'home' ? 'Ev Sahibi' : 'Deplasman'
        const timePrefix = `${quarter}Q | ${down}${down === 1 ? 'st' : down === 2 ? 'nd' : down === 3 ? 'rd' : 'th'} & ${distance}`

        let currentOffPower = offPower
        let currentDefPower = defPower

        if (quarter === 4) {
          if (offTac.x_rotation === 'ironman') currentOffPower -= 3
          if (defTac.x_rotation === 'ironman') currentDefPower -= 3
          if (offTac.q_scripting_4th === 'aggressive' && ((possession === 'home' && homeScore <= awayScore) || (possession === 'away' && awayScore <= homeScore))) {
            currentOffPower += 5
          }
        }

        const powerAdvantage = (currentOffPower - currentDefPower) / 100
        let roll = Math.random() + powerAdvantage

        // SITUATION ANALYZER
        let situationKey = 'first_down'
        if (down === 1) situationKey = 'first_down'
        else if (down === 2 && distance <= 3) situationKey = 'second_short'
        else if (down === 2 && distance > 3) situationKey = 'second_long'
        else if (down === 3 && distance <= 3) situationKey = 'third_short'
        else if (down === 3 && distance > 3) situationKey = 'third_long'
        else if (down === 4) situationKey = 'first_down' // 4th down is handled separately for punts, if played it defaults back to base

        // FIELD POSITION OVERRIDES
        if (yardLine >= 80 && yardLine < 95) situationKey = 'red_zone'
        else if (yardLine >= 95) situationKey = 'goal_line'
        else if (yardLine <= 10) situationKey = 'backed_up'

        // FETCH PLAYBOOK
        const offPlaybook = offTac.playbook?.offense || {
          first_down: 'play_action', second_short: 'power_run', second_long: 'short_pass',
          third_short: 'power_run', third_long: 'deep_bomb', red_zone: 'short_pass',
          goal_line: 'power_run', backed_up: 'power_run'
        }
        const defPlaybook = defTac.playbook?.defense || {
          first_down: 'balanced', second_short: 'stop_run', second_long: 'pass_def',
          third_short: 'stop_run', third_long: 'dime_prevent', red_zone: 'red_zone_wall',
          goal_line: 'goal_line_stand', backed_up: 'blitz'
        }

        let offFocus = (offPlaybook as any)[situationKey] || 'short_pass'
        let defFocus = (defPlaybook as any)[situationKey] || 'balanced'

        // CLOCK MANAGEMENT OVERRIDES
        const offClockMgmt = offTac.clock_mgmt || {}
        const defClockMgmt = defTac.clock_mgmt || {}
        const myScore = possession === 'home' ? homeScore : awayScore
        const theirScore = possession === 'home' ? awayScore : homeScore
        const scoreDiff = myScore - theirScore
        const isLate = playInQuarter >= 20 // son 5 oyun = ~son 2 dakika
        const isVeryLate = playInQuarter >= 22 // son 3 oyun

        // 2-MINUTE DRILL: Gerideyken, son dakikalarda hücum override
        if (isLate && scoreDiff < 0 && (quarter === 2 || quarter === 4)) {
          const drillMode = offClockMgmt.two_min_drill || 'hurry_pass'
          if (drillMode === 'hurry_pass') offFocus = 'short_pass'
          else if (drillMode === 'deep_shots') offFocus = 'deep_bomb'
          // balanced_hurry keeps the playbook choice
        }

        // 4-MINUTE OFFENSE: Öndeyken, son çeyrekte saat eritme override
        if (quarter === 4 && scoreDiff > 0 && isLate) {
          const fourMinMode = offClockMgmt.four_min_offense || 'grind_run'
          if (fourMinMode === 'grind_run') offFocus = 'power_run'
          else if (fourMinMode === 'safe_mix') {
            offFocus = Math.random() < 0.7 ? 'power_run' : 'short_pass'
          }
          // keep_scoring keeps the playbook choice
        }

        // TIMEOUT STRATEGY EFFECTS
        const defTimeoutStrat = defClockMgmt.timeout_strategy || 'save_late'
        if (defTimeoutStrat === 'ice_kicker' && isVeryLate && quarter === 4) {
          // Increases pressure on the offense in final moments
          currentDefPower += 2
        }
        if (defTimeoutStrat === 'stop_momentum' && scoreDiff < -7) {
          // If the defense is getting blown out, they call timeout to regroup
          currentDefPower += 3
        }

        const offCoaches = possession === 'home' ? homeCoaches : awayCoaches
        const defCoaches = possession === 'home' ? awayCoaches : homeCoaches
        
        const offCoach = offCoaches?.find(c => c.type === 'offensive')
        const defCoach = defCoaches?.find(c => c.type === 'defensive')
        
        let predictionText = ''
        
        if (offFocus === 'deep_bomb' && defFocus === 'blitz') {
          if (defCoach) {
             const predRoll = Math.random() * 100;
             if (predRoll < defCoach.prediction_rating) {
               predictionText = `[Koç ${defCoach.name} BLITZ'i iptal edip pası savundu - BAŞARILI TAHMİN!] `
               roll -= 0.15 
             } else {
               predictionText = `[Koç ${defCoach.name} hazırlıksız yakalandı! (Hatalı Okuma)] `
               roll += 0.15 
             }
          }
        } 
        else if (offFocus === 'short_pass' && defFocus === 'pass_def') {
          if (offCoach) {
             const predRoll = Math.random() * 100;
             if (predRoll < offCoach.prediction_rating) {
               predictionText = `[Hücum Koçu ${offCoach.name} ekran pası çağırdı - BAŞARILI TAHMİN!] `
               roll += 0.10 
             } else {
               predictionText = `[Hücum Koçu ${offCoach.name} savunmanın tuzağına düştü (Hatalı Okuma)] `
               roll -= 0.10
             }
          }
        }
        else if ((offFocus === 'power_run' || offFocus === 'outside_run') && defFocus === 'pass_def') {
          if (defCoach) {
             const predRoll = Math.random() * 100;
             if (predRoll < defCoach.prediction_rating) {
               predictionText = `[DC ${defCoach.name} koşuyu sezdi, kutuyu doldurdu - BAŞARILI TAHMİN!] `
               roll -= 0.15 
             } else {
               predictionText = `[DC ${defCoach.name} pas beklerken koşuyla ezildi! (Hatalı Okuma)] `
               roll += 0.15 
             }
          }
        }

        let outcomeText = predictionText
        let yardsGained = 0
        let isTurnover = false
        let isScore = false
        let eventOccurred: string | null = null
        let currentPlayType = offFocus

        if (down === 4) {
          const fourthDowns = offTac.fourth_downs || { fourth_1: 'punt', fourth_2_3: 'punt', fourth_4_6: 'punt', fourth_7_plus: 'punt', fourth_goal: 'fg' }
          let decision = 'punt'
          
          if (distance === 1) decision = fourthDowns.fourth_1
          else if (distance <= 3) decision = fourthDowns.fourth_2_3
          else if (distance <= 6) decision = fourthDowns.fourth_4_6
          else decision = fourthDowns.fourth_7_plus
          
          if (yardLine >= 80) decision = fourthDowns.fourth_goal

          if (decision === 'punt') {
            addLog(timePrefix, `${teamName} Punt vurdu (Degaj). Top rakibe geçiyor.`, "punt", null, yardLine + 40)
            yardLine += 40
            switchPossession()
            continue
          } else if (decision === 'fg') {
            if (yardLine < 60) {
              addLog(timePrefix, `${teamName} Field Goal mesafesinde değil, mecburen Punt vuruyor.`, "punt", null, yardLine + 40)
              yardLine += 40
              switchPossession()
              continue
            }
            const distanceToGoal = 100 - yardLine + 17
            const fgProb = distanceToGoal < 40 ? 0.95 : distanceToGoal < 50 ? 0.75 : 0.40
            if (Math.random() < fgProb) {
              if (possession === 'home') homeScore += 3; else awayScore += 3;
              addLog(timePrefix, getRandomLog("FIELD_GOAL_ISABETLI", teamName, distanceToGoal), "fg", "fg_good", 100)
            } else {
              addLog(timePrefix, getRandomLog("FIELD_GOAL_KACTI", teamName, distanceToGoal), "fg", "fg_miss", 100)
            }
            switchPossession(true)
            continue
          }
          outcomeText = `${teamName} 4th Down'da riske girip oyunu oynuyor! `
        }

        if (quarter === 4 && playInQuarter > 15 && offTac.signature_play === 'hail_mary' && offTac.signature_condition === 'late_behind') {
          const isTrailing = possession === 'home' ? homeScore < awayScore : awayScore < homeScore
          if (isTrailing) {
            offFocus = 'deep_bomb'
            currentPlayType = 'deep_bomb'
            outcomeText += "🚨 SIGNATURE PLAY! "
          }
        }

        const isHomeOffense = possession === 'home'
        const offTeamStr = isHomeOffense ? 'home' : 'away'
        const defTeamStr = isHomeOffense ? 'away' : 'home'

        // Traits
        const hasPocketPresence = hasTrait(offTeamStr, 'QB', 'Pocket Presence')
        const hasYacMachine = hasTrait(offTeamStr, 'WR', 'YAC Machine')
        const hasRoadGrader = hasTrait(offTeamStr, 'OL', 'Road Grader')
        const hasPassProtector = hasTrait(offTeamStr, 'OL', 'Pass Protector')
        const hasBallHawk = hasTrait(defTeamStr, 'DB', 'Ball Hawk')
        const hasHitPower = hasTrait(defTeamStr, 'LB', 'Hit Power') || hasTrait(defTeamStr, 'DL', 'Hit Power')

        // MAPPING NEW PLAYBOOK STRINGS TO BASE LOGIC
        const isDeep = offFocus === 'deep_bomb'
        const isRun = offFocus === 'power_run' || offFocus === 'outside_run' || offFocus === 'qb_scramble'
        const isPower = offFocus === 'power_run'
        const isScreen = offFocus === 'screen_pass'
        const isPlayAction = offFocus === 'play_action'
        
        const isPassDef = defFocus === 'pass_def' || defFocus === 'man_coverage' || defFocus === 'dime_prevent'
        const isRunDef = defFocus === 'stop_run' || defFocus === 'red_zone_wall' || defFocus === 'goal_line_stand'
        const isBlitz = defFocus === 'blitz'

        // BALANCED RNG LOGIC
        if (isDeep) {
          currentPlayType = 'deep_bomb'
          if (defFocus === 'dime_prevent') {
            // Hard counter to deep bomb
            if (roll < 0.90) yardsGained = 0, eventOccurred = 'incomplete', outcomeText += getRandomLog("INCOMPLETE_PASS", teamName)
            else if (roll < 0.95) isTurnover = true, eventOccurred = 'interception', outcomeText += getRandomLog("INTERCEPTION", teamName)
            else yardsGained = 15 + Math.floor(Math.random() * 10), outcomeText += getRandomLog("DERIN_BOMBA_BASARILI", teamName, yardsGained)
          } else if (isPassDef) {
            const intChance = hasBallHawk ? 0.82 : 0.85
            if (roll < 0.70) yardsGained = 0, eventOccurred = 'incomplete', outcomeText += getRandomLog("INCOMPLETE_PASS", teamName)
            else if (roll < intChance) isTurnover = true, eventOccurred = 'interception', outcomeText += getRandomLog("INTERCEPTION", teamName) + (hasBallHawk ? " (BALL HAWK!)" : "")
            else yardsGained = 20 + Math.floor(Math.random() * 20), outcomeText += getRandomLog("DERIN_BOMBA_BASARILI", teamName, yardsGained)
          } else if (isBlitz) {
            const sackChance = hasPassProtector ? 0.40 : 0.50
            if (roll < sackChance) yardsGained = -(5 + Math.floor(Math.random() * 5)), eventOccurred = 'sack', outcomeText += getRandomLog("SACK", teamName, yardsGained)
            else yardsGained = 30 + Math.floor(Math.random() * 30), outcomeText += getRandomLog("DERIN_BOMBA_BASARILI", teamName, yardsGained)
          } else {
            const intChance = hasBallHawk ? 0.72 : 0.75
            if (roll < 0.60) yardsGained = 0, eventOccurred = 'incomplete', outcomeText += getRandomLog("INCOMPLETE_PASS", teamName)
            else if (roll < intChance) isTurnover = true, eventOccurred = 'interception', outcomeText += getRandomLog("INTERCEPTION", teamName) + (hasBallHawk ? " (BALL HAWK!)" : "")
            else yardsGained = 20 + Math.floor(Math.random() * 25), outcomeText += getRandomLog("DERIN_BOMBA_BASARILI", teamName, yardsGained)
          }
        } 
        else if (isRun) {
          currentPlayType = 'run'
          if (defFocus === 'dime_prevent') {
            // Dime prevent gets crushed by runs
            yardsGained = 10 + Math.floor(Math.random() * 10), outcomeText += getRandomLog("ICERIDEN_SERT_KOSU", teamName, yardsGained) + " (Dime Savunması ezildi!)"
          } else if (isRunDef) {
            if (roll < 0.65) yardsGained = Math.floor(Math.random() * 2), outcomeText += yardsGained === 0 ? getRandomLog("NO_GAIN", teamName) : getRandomLog("ICERIDEN_SERT_KOSU", teamName, yardsGained)
            else yardsGained = 2 + Math.floor(Math.random() * 4), outcomeText += isPower ? getRandomLog("ICERIDEN_SERT_KOSU", teamName, yardsGained) : getRandomLog("DISARIDAN_KOSU_BASARILI", teamName, yardsGained)
          } else if (isPassDef) {
            yardsGained = 4 + Math.floor(Math.random() * 6), outcomeText += isPower ? getRandomLog("ICERIDEN_SERT_KOSU", teamName, yardsGained) : getRandomLog("DISARIDAN_KOSU_BASARILI", teamName, yardsGained)
          } else {
            const fumbleChance = hasHitPower ? 0.28 : 0.25
            if (roll < 0.20) yardsGained = 0, outcomeText += getRandomLog("NO_GAIN", teamName)
            else if (roll < fumbleChance) isTurnover = true, eventOccurred = 'fumble', outcomeText += getRandomLog("FUMBLE", teamName) + (hasHitPower ? " (HIT POWER!)" : "")
            else yardsGained = 3 + Math.floor(Math.random() * 5) + (isPower && hasRoadGrader ? 2 : 0), outcomeText += (isPower ? getRandomLog("ICERIDEN_SERT_KOSU", teamName, yardsGained) : getRandomLog("DISARIDAN_KOSU_BASARILI", teamName, yardsGained)) + (isPower && hasRoadGrader ? " (ROAD GRADER Block!)" : "")
          }
        } 
        else {
          // short_pass, screen_pass, play_action
          currentPlayType = 'short_pass'
          
          if (isScreen && isBlitz) {
            // Screen perfectly counters blitz
            yardsGained = 15 + Math.floor(Math.random() * 15), outcomeText += getRandomLog("KISA_PAS_BASARILI", teamName, yardsGained) + " (Screen pası Blitz'i cezalandırdı!)"
          }
          else if (isPlayAction && isRunDef) {
            // Play action perfectly counters run stop
            yardsGained = 15 + Math.floor(Math.random() * 10), outcomeText += getRandomLog("DERIN_BOMBA_BASARILI", teamName, yardsGained) + " (Play-Action savunmayı kandırdı!)"
          }
          else if (isBlitz) {
            if (roll < 0.3) yardsGained = 0, eventOccurred = 'incomplete', outcomeText += getRandomLog("INCOMPLETE_PASS", teamName)
            else yardsGained = 8 + Math.floor(Math.random() * 10), outcomeText += getRandomLog("KISA_PAS_BASARILI", teamName, yardsGained)
          } else if (isPassDef) {
            if (roll < 0.65) yardsGained = 0, eventOccurred = 'incomplete', outcomeText += getRandomLog("INCOMPLETE_PASS", teamName)
            else if (roll < 0.75) isTurnover = true, eventOccurred = 'interception', outcomeText += getRandomLog("INTERCEPTION", teamName)
            else yardsGained = 2 + Math.floor(Math.random() * 4), outcomeText += getRandomLog("KISA_PAS_BASARILI", teamName, yardsGained)
          } else {
            if (roll < 0.40) yardsGained = 0, eventOccurred = 'incomplete', outcomeText += getRandomLog("INCOMPLETE_PASS", teamName)
            else yardsGained = 4 + Math.floor(Math.random() * 6) + (hasYacMachine ? 3 : 0), outcomeText += getRandomLog("KISA_PAS_BASARILI", teamName, yardsGained) + (hasYacMachine ? " (YAC MACHINE!)" : "")
          }
          
          if (eventOccurred === 'sack' && hasPocketPresence && Math.random() < 0.5) {
             eventOccurred = 'incomplete'
             yardsGained = 0
             outcomeText = "Pocket daraldı ancak oyun kurucu (POCKET PRESENCE!) sayesinde sack olmaktan kurtulup topu fırlattı! Incomplete pass."
          }
        }

        if (offTac.x_aggressiveness === 'physical' && Math.random() < 0.05) {
          yardsGained = -10
          outcomeText = "Hücum takımından gereksiz sertlik (Holding/Personal Foul) cezası! 10 yarda geriye."
          eventOccurred = 'penalty'
          currentPlayType = 'penalty'
        }
        if (defTac.x_aggressiveness === 'physical' && Math.random() < 0.05) {
          yardsGained = 15
          outcomeText = "Savunma takımından maskeden çekme (Face Mask) cezası! Otomatik First Down ve 15 yarda."
          eventOccurred = 'penalty'
          currentPlayType = 'penalty'
        }

        let endY = yardLine + yardsGained

        if (isTurnover) {
          addLog(timePrefix, outcomeText, currentPlayType, eventOccurred, endY)
          yardLine = endY
          switchPossession()
          continue
        }

        yardLine += yardsGained

        if (yardLine >= 100) {
          // TOUCHDOWN!
          const scoringTeam = possession
          const scoringTac = possession === 'home' ? homeTac : awayTac
          const clockMgmtData = scoringTac.clock_mgmt || {}
          const twoPointChart = clockMgmtData.two_point_chart || {}
          
          // Determine score difference BEFORE this TD
          const scorerScore = scoringTeam === 'home' ? homeScore : awayScore
          const opponentScore = scoringTeam === 'home' ? awayScore : homeScore
          const diff = scorerScore - opponentScore // negative = behind

          // Decide: Extra Point (1) or 2-Point Conversion
          let goForTwo = false
          if (diff <= -14) goForTwo = twoPointChart.down_14 === 'go2'
          else if (diff <= -11) goForTwo = twoPointChart.down_11 === 'go2'
          else if (diff <= -8) goForTwo = twoPointChart.down_8 === 'go2'
          else if (diff <= -5) goForTwo = twoPointChart.down_5 === 'go2'
          else if (diff < 0) goForTwo = twoPointChart.down_2 === 'go2'
          else if (diff <= 7) goForTwo = twoPointChart.up_1 === 'go2'
          else goForTwo = twoPointChart.up_any === 'go2'

          let tdPoints = 6
          let patText = ''

          if (goForTwo) {
            // 2-Point Conversion: ~45% success
            if (Math.random() < 0.45) {
              tdPoints = 8
              patText = ' [2-POINT BAŞARILI!]'
            } else {
              tdPoints = 6
              patText = ' [2-POINT BAŞARISIZ]'
            }
          } else {
            // Extra Point Kick: ~95% success
            if (Math.random() < 0.95) {
              tdPoints = 7
              patText = ''
            } else {
              tdPoints = 6
              patText = ' [Ekstra Puan KAÇTI!]'
            }
          }

          if (possession === 'home') homeScore += tdPoints; else awayScore += tdPoints;
          outcomeText = outcomeText + " " + getRandomLog("TOUCHDOWN", teamName) + patText
          addLog(timePrefix, outcomeText, currentPlayType, 'touchdown', 100)
          switchPossession(true)
          continue
        }

        if (yardLine <= 0) {
          if (possession === 'home') awayScore += 2; else homeScore += 2;
          addLog(timePrefix, `${outcomeText} İNANILMAZ! Kendi endzone'unda düşürüldü. SAFETY! Rakip 2 sayı kazanıyor.`, currentPlayType, 'safety', 0)
          switchPossession(true)
          continue
        }

        distance -= yardsGained

        if (distance <= 0) {
          down = 1
          distance = 10
          if (yardLine + distance > 100) distance = 100 - yardLine
          addLog(timePrefix, `${outcomeText} (FIRST DOWN!)`, currentPlayType, eventOccurred, yardLine)
        } else {
          down++
          addLog(timePrefix, outcomeText, currentPlayType, eventOccurred, yardLine)
          if (down > 4) {
            outcomeText += " " + getRandomLog("TURNOVER_ON_DOWNS", teamName)
            addLog(timePrefix, outcomeText, 'turnover', 'turnover', yardLine)
            switchPossession()
          }
        }
      }

      if (homeScore === awayScore) {
        if (Math.random() < homePower / (homePower + awayPower)) {
          homeScore += 3
          addLog("OT", getRandomLog("FIELD_GOAL_ISABETLI", "Ev Sahibi", 30), "fg", "fg_good", 100)
        } else {
          awayScore += 3
          addLog("OT", getRandomLog("FIELD_GOAL_ISABETLI", "Deplasman", 30), "fg", "fg_good", 100)
        }
      }

      await supabaseAdmin.from('matches').update({
        home_score: homeScore,
        away_score: awayScore,
        final_stats: { 
          played: true, 
          summary: `Taktiksel Down-by-Down Motor. Toplam ${maxPlaysPerQuarter * 4} oyun oynandı.` 
        }
      }).eq('id', match.id)

      await supabaseAdmin.from('match_drive_logs').insert({
        match_id: match.id,
        plays: logs,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })

      const { data: capStadium } = await supabaseAdmin.from('stadiums').select('capacity_level').eq('franchise_id', match.home_franchise_id).single()
      let gateMult = 1.0
      if (capStadium) {
        if (capStadium.capacity_level === 1) gateMult = 1.2
        if (capStadium.capacity_level === 2) gateMult = 1.4
        if (capStadium.capacity_level === 3) gateMult = 1.6
      }
      
      const homeWinFactor = homeScore > awayScore ? 1.0 : 0.6
      const homeRevenue = Math.floor(400000 * gateMult * homeWinFactor)
      
      const SPONSORS: Record<string, { basePay: number, winBonus: number }> = {
        safe: { basePay: 500000, winBonus: 50000 },
        perf: { basePay: 200000, winBonus: 150000 },
        risk: { basePay: 0, winBonus: 300000 }
      }

      const { data: homeFranchise } = await supabaseAdmin.from('franchises').select('club_fund, active_sponsor_id').eq('id', match.home_franchise_id).single()
      if (homeFranchise) {
        let sponsorPay = 0
        if (homeFranchise.active_sponsor_id && SPONSORS[homeFranchise.active_sponsor_id]) {
          const sp = SPONSORS[homeFranchise.active_sponsor_id]
          sponsorPay = sp.basePay + (homeScore > awayScore ? sp.winBonus : 0)
        }
        await supabaseAdmin.from('franchises').update({ club_fund: homeFranchise.club_fund + homeRevenue + sponsorPay }).eq('id', match.home_franchise_id)
      }

      const { data: awayFranchise } = await supabaseAdmin.from('franchises').select('club_fund, active_sponsor_id').eq('id', match.away_franchise_id).single()
      if (awayFranchise) {
        let sponsorPay = 0
        if (awayFranchise.active_sponsor_id && SPONSORS[awayFranchise.active_sponsor_id]) {
          const sp = SPONSORS[awayFranchise.active_sponsor_id]
          sponsorPay = sp.basePay + (awayScore > homeScore ? sp.winBonus : 0)
        }
        await supabaseAdmin.from('franchises').update({ club_fund: awayFranchise.club_fund + 80000 + sponsorPay }).eq('id', match.away_franchise_id)
      }
    }

    return new Response(JSON.stringify({ success: true, message: `Hafta ${week} Down-by-Down motoru ile simüle edildi.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})
