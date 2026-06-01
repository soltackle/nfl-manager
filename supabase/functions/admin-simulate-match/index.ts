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
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''))
    if (userError || !user) throw new Error('Invalid token')

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
        const roll = Math.random() + powerAdvantage

        let offFocus = offTac.off_focus || 'short_pass'
        const defFocus = defTac.def_focus || 'balanced'

        let outcomeText = ''
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

        // BALANCED RNG LOGIC
        if (offFocus === 'deep_bomb') {
          currentPlayType = 'deep_bomb'
          if (defFocus === 'pass_def') {
            const intChance = hasBallHawk ? 0.82 : 0.85
            if (roll < 0.70) yardsGained = 0, eventOccurred = 'incomplete', outcomeText += getRandomLog("INCOMPLETE_PASS", teamName)
            else if (roll < intChance) isTurnover = true, eventOccurred = 'interception', outcomeText += getRandomLog("INTERCEPTION", teamName) + (hasBallHawk ? " (BALL HAWK!)" : "")
            else yardsGained = 20 + Math.floor(Math.random() * 20), outcomeText += getRandomLog("DERIN_BOMBA_BASARILI", teamName, yardsGained)
          } else if (defFocus === 'blitz') {
            const sackChance = hasPassProtector ? 0.40 : 0.50
            if (roll < sackChance) yardsGained = -(5 + Math.floor(Math.random() * 5)), eventOccurred = 'sack', outcomeText += getRandomLog("SACK", teamName, yardsGained)
            else yardsGained = 30 + Math.floor(Math.random() * 30), outcomeText += getRandomLog("DERIN_BOMBA_BASARILI", teamName, yardsGained)
          } else {
            // balanced defense
            const intChance = hasBallHawk ? 0.72 : 0.75
            if (roll < 0.60) yardsGained = 0, eventOccurred = 'incomplete', outcomeText += getRandomLog("INCOMPLETE_PASS", teamName)
            else if (roll < intChance) isTurnover = true, eventOccurred = 'interception', outcomeText += getRandomLog("INTERCEPTION", teamName) + (hasBallHawk ? " (BALL HAWK!)" : "")
            else yardsGained = 20 + Math.floor(Math.random() * 25), outcomeText += getRandomLog("DERIN_BOMBA_BASARILI", teamName, yardsGained)
          }
        } 
        else if (offFocus === 'power_run' || offFocus === 'outside_run') {
          currentPlayType = 'run'
          const isPower = offFocus === 'power_run'
          if (defFocus === 'stop_run') {
            if (roll < 0.65) yardsGained = Math.floor(Math.random() * 2), outcomeText += yardsGained === 0 ? getRandomLog("NO_GAIN", teamName) : getRandomLog("ICERIDEN_SERT_KOSU", teamName, yardsGained)
            else yardsGained = 2 + Math.floor(Math.random() * 4), outcomeText += isPower ? getRandomLog("ICERIDEN_SERT_KOSU", teamName, yardsGained) : getRandomLog("DISARIDAN_KOSU_BASARILI", teamName, yardsGained)
          } else if (defFocus === 'pass_def') {
            yardsGained = 4 + Math.floor(Math.random() * 6), outcomeText += isPower ? getRandomLog("ICERIDEN_SERT_KOSU", teamName, yardsGained) : getRandomLog("DISARIDAN_KOSU_BASARILI", teamName, yardsGained)
          } else {
            // balanced defense
            const fumbleChance = hasHitPower ? 0.28 : 0.25
            if (roll < 0.20) yardsGained = 0, outcomeText += getRandomLog("NO_GAIN", teamName)
            else if (roll < fumbleChance) isTurnover = true, eventOccurred = 'fumble', outcomeText += getRandomLog("FUMBLE", teamName) + (hasHitPower ? " (HIT POWER!)" : "")
            else yardsGained = 3 + Math.floor(Math.random() * 5) + (isPower && hasRoadGrader ? 2 : 0), outcomeText += (isPower ? getRandomLog("ICERIDEN_SERT_KOSU", teamName, yardsGained) : getRandomLog("DISARIDAN_KOSU_BASARILI", teamName, yardsGained)) + (isPower && hasRoadGrader ? " (ROAD GRADER Block!)" : "")
          }
        } 
        else {
          // short_pass
          currentPlayType = 'short_pass'
          if (defFocus === 'blitz') {
            if (roll < 0.3) yardsGained = 0, eventOccurred = 'incomplete', outcomeText += getRandomLog("INCOMPLETE_PASS", teamName)
            else yardsGained = 8 + Math.floor(Math.random() * 10), outcomeText += getRandomLog("KISA_PAS_BASARILI", teamName, yardsGained)
          } else if (defFocus === 'pass_def') {
            if (roll < 0.65) yardsGained = 0, eventOccurred = 'incomplete', outcomeText += getRandomLog("INCOMPLETE_PASS", teamName)
            else if (roll < 0.75) isTurnover = true, eventOccurred = 'interception', outcomeText += getRandomLog("INTERCEPTION", teamName)
            else yardsGained = 2 + Math.floor(Math.random() * 4), outcomeText += getRandomLog("KISA_PAS_BASARILI", teamName, yardsGained)
          } else {
            // balanced
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
          if (possession === 'home') homeScore += 7; else awayScore += 7;
          outcomeText = outcomeText + " " + getRandomLog("TOUCHDOWN", teamName)
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
      
      const { data: homeFranchise } = await supabaseAdmin.from('franchises').select('club_fund').eq('id', match.home_franchise_id).single()
      if (homeFranchise) {
        await supabaseAdmin.from('franchises').update({ club_fund: homeFranchise.club_fund + homeRevenue }).eq('id', match.home_franchise_id)
      }

      const { data: awayFranchise } = await supabaseAdmin.from('franchises').select('club_fund').eq('id', match.away_franchise_id).single()
      if (awayFranchise) {
        await supabaseAdmin.from('franchises').update({ club_fund: awayFranchise.club_fund + 80000 }).eq('id', match.away_franchise_id)
      }
    }

    return new Response(JSON.stringify({ success: true, message: `Hafta ${week} Down-by-Down motoru ile simüle edildi.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
