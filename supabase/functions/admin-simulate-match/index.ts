import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

      // Get Powers
      const { data: homePlayers } = await supabaseAdmin.from('players').select('overall').eq('franchise_id', match.home_franchise_id)
      const { data: awayPlayers } = await supabaseAdmin.from('players').select('overall').eq('franchise_id', match.away_franchise_id)
      
      const getTeamPower = (players: any[]) => {
        if (!players || players.length === 0) return 50
        const sorted = players.sort((a, b) => b.overall - a.overall).slice(0, 11)
        return sorted.reduce((sum, p) => sum + p.overall, 0) / sorted.length
      }

      let homePower = getTeamPower(homePlayers)
      let awayPower = getTeamPower(awayPlayers)

      // Get Tactics
      const { data: homeTacData } = await supabaseAdmin.from('tactics').select('slider_ayarlari').eq('franchise_id', match.home_franchise_id).single()
      const { data: awayTacData } = await supabaseAdmin.from('tactics').select('slider_ayarlari').eq('franchise_id', match.away_franchise_id).single()
      
      const homeTac = (homeTacData?.slider_ayarlari || {}) as any
      const awayTac = (awayTacData?.slider_ayarlari || {}) as any

      // Apply Stadium Advantage
      const { data: stadium } = await supabaseAdmin.from('stadiums').select('turf_level').eq('franchise_id', match.home_franchise_id).single()
      if (stadium) {
        if (stadium.turf_level === 1) homePower *= 1.02
        if (stadium.turf_level === 2) homePower *= 1.04
        if (stadium.turf_level === 3) homePower *= 1.06
      }

      // X-Factors
      if (homeTac.x_aggressiveness === 'physical') homePower += 2
      if (awayTac.x_aggressiveness === 'physical') awayPower += 2
      if (homeTac.x_rotation === 'ironman') homePower += 2
      if (awayTac.x_rotation === 'ironman') awayPower += 2

      // Match State
      let homeScore = 0
      let awayScore = 0
      let possession = 'home' // 'home' or 'away'
      let yardLine = 25 // 1 to 99. 99 is 1 yard away from scoring TD. 25 is touchback line.
      let down = 1
      let distance = 10
      let quarter = 1
      let playInQuarter = 0
      const maxPlaysPerQuarter = 25 // 100 plays total
      const logs: any[] = []

      logs.push({ time: "BAŞLANGIÇ", text: "Maç başladı! İlk hücum hakkı Ev Sahibi'nde." })

      const switchPossession = (isKickoff = false) => {
        possession = possession === 'home' ? 'away' : 'home'
        yardLine = isKickoff ? 25 : 100 - yardLine // Fumble/Downs turnover flips the field
        if (yardLine <= 0) yardLine = 20 // Touchback
        if (yardLine >= 100) yardLine = 99 // Safety prevention for simplicity
        down = 1
        distance = 10
      }

      // Main Loop
      for (let totalPlays = 0; totalPlays < maxPlaysPerQuarter * 4; totalPlays++) {
        quarter = Math.floor(totalPlays / maxPlaysPerQuarter) + 1
        playInQuarter = totalPlays % maxPlaysPerQuarter

        const offTac = possession === 'home' ? homeTac : awayTac
        const defTac = possession === 'home' ? awayTac : homeTac
        const offPower = possession === 'home' ? homePower : awayPower
        const defPower = possession === 'home' ? awayPower : homePower

        const teamName = possession === 'home' ? 'Ev Sahibi' : 'Deplasman'
        const timePrefix = `${quarter}Q | ${down}${down === 1 ? 'st' : down === 2 ? 'nd' : down === 3 ? 'rd' : 'th'} & ${distance}`

        // Check Quarter Scripting & Fatigue
        let currentOffPower = offPower
        let currentDefPower = defPower

        if (quarter === 4) {
          if (offTac.x_rotation === 'ironman') currentOffPower -= 3
          if (defTac.x_rotation === 'ironman') currentDefPower -= 3

          if (offTac.q_scripting_4th === 'aggressive' && ((possession === 'home' && homeScore <= awayScore) || (possession === 'away' && awayScore <= homeScore))) {
            currentOffPower += 5 // Desperation boost
          }
        }

        // Calculate Play Outcome
        // Base RNG + Power Diff
        const powerAdvantage = (currentOffPower - currentDefPower) / 100 // usually between -0.2 and +0.2
        const roll = Math.random() + powerAdvantage

        // Tactical Modifiers
        let offFocus = offTac.off_focus || 'short_pass'
        const defFocus = defTac.def_focus || 'balanced'

        let outcomeText = ''
        let yardsGained = 0
        let isTurnover = false
        let isScore = false

        // Decision logic
        if (down === 4) {
          const fourthDowns = offTac.fourth_downs || { fourth_1: 'punt', fourth_2_3: 'punt', fourth_4_6: 'punt', fourth_7_plus: 'punt', fourth_goal: 'fg' }
          let decision = 'punt'
          
          if (distance === 1) decision = fourthDowns.fourth_1
          else if (distance <= 3) decision = fourthDowns.fourth_2_3
          else if (distance <= 6) decision = fourthDowns.fourth_4_6
          else decision = fourthDowns.fourth_7_plus
          
          if (yardLine >= 80) decision = fourthDowns.fourth_goal

          if (decision === 'punt') {
            logs.push({ time: timePrefix, text: `${teamName} Punt vurdu (Degaj). Top rakibe geçiyor.` })
            yardLine += 40 // Punt distance
            switchPossession()
            continue
          } else if (decision === 'fg') {
            if (yardLine < 60) {
              // Too far for FG, just punt
              logs.push({ time: timePrefix, text: `${teamName} Field Goal mesafesinde değil, mecburen Punt vuruyor.` })
              yardLine += 40
              switchPossession()
              continue
            }
            // FG attempt
            const distanceToGoal = 100 - yardLine + 17 // FG distance
            const fgProb = distanceToGoal < 40 ? 0.95 : distanceToGoal < 50 ? 0.75 : 0.40
            if (Math.random() < fgProb) {
              if (possession === 'home') homeScore += 3; else awayScore += 3;
              logs.push({ time: timePrefix, text: `${teamName} FIELD GOAL (3 sayı) isabetli! Şut mesafesi: ${distanceToGoal} yarda.` })
            } else {
              logs.push({ time: timePrefix, text: `${teamName} FIELD GOAL kaçırdı!` })
            }
            switchPossession(true) // Kickoff after score or missed FG from spot
            continue
          }
          // If 'go', continue to play calculation
          outcomeText = `${teamName} 4th Down'da riske girip oyunu oynuyor! `
        }

        // Signature Play?
        let isSignaturePlay = false
        if (quarter === 4 && playInQuarter > 15 && offTac.signature_play === 'hail_mary' && offTac.signature_condition === 'late_behind') {
          const isTrailing = possession === 'home' ? homeScore < awayScore : awayScore < homeScore
          if (isTrailing) {
            isSignaturePlay = true
            offFocus = 'deep_bomb'
            outcomeText += "🚨 SIGNATURE PLAY: Son bir umut, HAIL MARY deneniyor! "
          }
        }

        // Play Result Calculation based on Focus
        if (offFocus === 'deep_bomb') {
          if (defFocus === 'pass_def') {
            if (roll < 0.6) yardsGained = 0, outcomeText += "Derin pas denemesi, ancak savunma geride hazırlıklı, pas yere düştü."
            else if (roll < 0.8) isTurnover = true, outcomeText += "Derin pas, ancak INTERCEPTION! Savunma topu çaldı!"
            else yardsGained = 30 + Math.floor(Math.random() * 20), outcomeText += `Mükemmel bir derin pas! Savunmaya rağmen ${yardsGained} yarda kazanıldı.`
          } else if (defFocus === 'blitz') {
            if (roll < 0.4) yardsGained = -7, outcomeText += "Derin pas için zaman kalmadı, SACK! Oyun kurucu devrildi."
            else yardsGained = 40 + Math.floor(Math.random() * 30), outcomeText += `Blitz'i cezalandırdılar! Derin pas boşta kaldı, devasa bir kazanç: ${yardsGained} yarda!`
          } else {
            if (roll < 0.4) yardsGained = 0, outcomeText += "Derin pas denemesi başarısız, top dışarıda."
            else if (roll < 0.5) isTurnover = true, outcomeText += "Derin pas, INTERCEPTION!"
            else yardsGained = 25 + Math.floor(Math.random() * 25), outcomeText += `Güzel bir uzun pas yakalayışı! ${yardsGained} yarda kazanç.`
          }
        } else if (offFocus === 'power_run' || offFocus === 'outside_run') {
          const runType = offFocus === 'power_run' ? 'İçeriden sert koşu' : 'Dışarıdan hızlı koşu'
          if (defFocus === 'stop_run') {
            if (roll < 0.7) yardsGained = Math.floor(Math.random() * 3) - 1, outcomeText += `${runType}, ancak savunma duvar ördü! Sadece ${yardsGained} yarda.`
            else yardsGained = 5 + Math.floor(Math.random() * 5), outcomeText += `${runType}, zorlu da olsa ${yardsGained} yarda kazanıldı.`
          } else if (defFocus === 'pass_def') {
            yardsGained = 4 + Math.floor(Math.random() * 8), outcomeText += `${runType}, savunma pas beklediği için boşluk bulundu: ${yardsGained} yarda.`
          } else {
            if (roll < 0.1) isTurnover = true, outcomeText += `${runType}, ancak FUMBLE! Topu düşürdüler ve savunma aldı!`
            else yardsGained = 2 + Math.floor(Math.random() * 6), outcomeText += `${runType}, ${yardsGained} yarda kazanç.`
          }
        } else {
          // short_pass or mobile_qb
          if (defFocus === 'blitz') {
            yardsGained = 6 + Math.floor(Math.random() * 10), outcomeText += "Blitz'e karşı hızlı kısa pas! Savunma eksik yakalandı, " + yardsGained + " yarda kazanç."
          } else if (defFocus === 'pass_def') {
            if (roll < 0.4) yardsGained = 0, outcomeText += "Kısa pas denemesi, savunma çok iyi kapattı, incomplete."
            else yardsGained = 3 + Math.floor(Math.random() * 4), outcomeText += `Zorlama kısa pas, sadece ${yardsGained} yarda.`
          } else {
            yardsGained = 4 + Math.floor(Math.random() * 7), outcomeText += `Dengeli oyuna karşı rahat kısa pas, ${yardsGained} yarda kazanç.`
          }
        }

        // Apply Penalty RNG
        if (offTac.x_aggressiveness === 'physical' && Math.random() < 0.05) {
          yardsGained = -10
          outcomeText = "Hücum takımından gereksiz sertlik (Holding/Personal Foul) cezası! 10 yarda geriye."
        }
        if (defTac.x_aggressiveness === 'physical' && Math.random() < 0.05) {
          yardsGained = 15
          outcomeText = "Savunma takımından maskeden çekme (Face Mask) cezası! Otomatik First Down ve 15 yarda."
        }

        // State Update
        if (isTurnover) {
          logs.push({ time: timePrefix, text: outcomeText })
          switchPossession()
          continue
        }

        yardLine += yardsGained

        if (yardLine >= 100) {
          if (possession === 'home') homeScore += 7; else awayScore += 7;
          logs.push({ time: timePrefix, text: `${outcomeText} VE TOUCHDOWN (7 sayı)!! Harika bir hücum.` })
          switchPossession(true)
          continue
        }

        if (yardLine <= 0) {
          // Safety (rare)
          if (possession === 'home') awayScore += 2; else homeScore += 2;
          logs.push({ time: timePrefix, text: `${outcomeText} İNANILMAZ! Kendi endzone'unda düşürüldü. SAFETY! Rakip 2 sayı kazanıyor.` })
          switchPossession(true)
          continue
        }

        distance -= yardsGained

        if (distance <= 0) {
          down = 1
          distance = 10
          // Can't have distance to goal be > remaining yards
          if (yardLine + distance > 100) distance = 100 - yardLine
          logs.push({ time: timePrefix, text: `${outcomeText} - FIRST DOWN!` })
        } else {
          down++
          logs.push({ time: timePrefix, text: outcomeText })
          if (down > 4) {
            logs.push({ time: timePrefix, text: "4th Down başarısız! TURNOVER ON DOWNS. Top rakibe geçiyor." })
            switchPossession()
          }
        }
      }

      // Tie breaker (OT simplified)
      if (homeScore === awayScore) {
        if (Math.random() < homePower / (homePower + awayPower)) {
          homeScore += 3
          logs.push({ time: "OT", text: "Uzatmalarda Ev Sahibi FG bularak maçı noktaladı!" })
        } else {
          awayScore += 3
          logs.push({ time: "OT", text: "Uzatmalarda Deplasman FG bularak maçı noktaladı!" })
        }
      }

      // Final Update
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

      // Economy
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
