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
      if (match.final_stats?.played) continue // skip already played

      // 1. Get Players & Power
      const { data: homePlayers } = await supabaseAdmin.from('players').select('overall').eq('franchise_id', match.home_franchise_id)
      const { data: awayPlayers } = await supabaseAdmin.from('players').select('overall').eq('franchise_id', match.away_franchise_id)
      
      const getTeamPower = (players: any[]) => {
        if (!players || players.length === 0) return 50
        const sorted = players.sort((a, b) => b.overall - a.overall).slice(0, 11)
        return sorted.reduce((sum, p) => sum + p.overall, 0) / sorted.length
      }

      let homeBasePower = getTeamPower(homePlayers)
      let awayBasePower = getTeamPower(awayPlayers)

      // 2. Get Tactics
      const { data: homeTacData } = await supabaseAdmin.from('tactics').select('slider_ayarlari').eq('franchise_id', match.home_franchise_id).single()
      const { data: awayTacData } = await supabaseAdmin.from('tactics').select('slider_ayarlari').eq('franchise_id', match.away_franchise_id).single()
      
      const homeTac = (homeTacData?.slider_ayarlari || {}) as any
      const awayTac = (awayTacData?.slider_ayarlari || {}) as any

      // Tactical Matchups (Rock-Paper-Scissors)
      const getMatchupModifier = (offFocus: string, defFocus: string) => {
        if (offFocus === 'short_pass' && defFocus === 'pass_def') return -0.05
        if (offFocus === 'deep_bomb' && defFocus === 'pass_def') return -0.10
        if (offFocus === 'deep_bomb' && defFocus === 'stop_run') return 0.15
        if (offFocus === 'power_run' && defFocus === 'stop_run') return -0.10
        if (offFocus === 'outside_run' && defFocus === 'stop_run') return -0.05
        if (offFocus === 'short_pass' && defFocus === 'blitz') return 0.10
        if (offFocus === 'power_run' && defFocus === 'blitz') return 0.10
        if (offFocus === 'deep_bomb' && defFocus === 'blitz') return 0.15 // high risk high reward
        return 0
      }

      const homeOffMod = getMatchupModifier(homeTac.off_focus, awayTac.def_focus)
      const awayOffMod = getMatchupModifier(awayTac.off_focus, homeTac.def_focus)

      // X-Factors
      if (homeTac.x_aggressiveness === 'physical') homeBasePower += 2
      if (awayTac.x_aggressiveness === 'physical') awayBasePower += 2
      if (homeTac.x_rotation === 'ironman') homeBasePower += 2
      if (awayTac.x_rotation === 'ironman') awayBasePower += 2

      // 3. Stadium Advantage
      const { data: stadium } = await supabaseAdmin.from('stadiums').select('turf_level').eq('franchise_id', match.home_franchise_id).single()
      let homeAdvantage = 1.05
      if (stadium) {
        if (stadium.turf_level === 1) homeAdvantage += 0.02
        if (stadium.turf_level === 2) homeAdvantage += 0.04
        if (stadium.turf_level === 3) homeAdvantage += 0.06
      }

      let finalHomePower = (homeBasePower * homeAdvantage) * (1 + homeOffMod)
      let finalAwayPower = awayBasePower * (1 + awayOffMod)

      const totalPower = finalHomePower + finalAwayPower
      let baseHomeWinProb = finalHomePower / totalPower

      let homeScore = 0
      let awayScore = 0
      const logs: any[] = []

      // 10 Drives Simulator
      for (let i = 0; i < 10; i++) {
        let currentHomeProb = baseHomeWinProb
        let currentAwayProb = 1 - baseHomeWinProb

        const is4thQuarter = i >= 7 // Drives 7,8,9 are 4th Q
        const isLateGame = i === 9 // Last drive

        // Quarter Scripting
        if (is4thQuarter) {
          // Home
          if (homeTac.q_scripting_4th === 'hold_lead' && homeScore > awayScore) {
            currentHomeProb -= 0.1 // playing conservative
            currentAwayProb -= 0.1 // burning clock lowers total chances
            logs.push({ time: `4Q Drive ${i+1}`, text: "Ev sahibi süreyi eritmeye yönelik, defansif bir drive izliyor." })
          } else if (homeTac.q_scripting_4th === 'aggressive' && homeScore <= awayScore) {
            currentHomeProb += 0.1
            logs.push({ time: `4Q Drive ${i+1}`, text: "Ev sahibi geride ve tamamen agresif pas oyununa döndü!" })
          }
          // Away
          if (awayTac.q_scripting_4th === 'hold_lead' && awayScore > homeScore) {
            currentAwayProb -= 0.1
            currentHomeProb -= 0.1
            logs.push({ time: `4Q Drive ${i+1}`, text: "Deplasman takımı skoru korumak için güvenli oyunlar seçiyor." })
          } else if (awayTac.q_scripting_4th === 'aggressive' && awayScore <= homeScore) {
            currentAwayProb += 0.1
            logs.push({ time: `4Q Drive ${i+1}`, text: "Deplasman takımı maçı çevirmek için risk alıyor!" })
          }
        }

        // Signature Play
        if (isLateGame) {
          if (homeTac.signature_play === 'hail_mary' && homeScore < awayScore && homeTac.signature_condition === 'late_behind') {
            currentHomeProb += 0.3
            logs.push({ time: `4Q 01:00`, text: "🚨 SIGNATURE PLAY: Ev Sahibi son şans olarak HAIL MARY deniyor!" })
          }
          if (awayTac.signature_play === 'hail_mary' && awayScore < homeScore && awayTac.signature_condition === 'late_behind') {
            currentAwayProb += 0.3
            logs.push({ time: `4Q 01:00`, text: "🚨 SIGNATURE PLAY: Deplasman takımı son şans olarak HAIL MARY deniyor!" })
          }
        }

        // Fatigue Penalty for Ironman
        if (is4thQuarter) {
          if (homeTac.x_rotation === 'ironman') currentHomeProb -= 0.05
          if (awayTac.x_rotation === 'ironman') currentAwayProb -= 0.05
        }

        // Home Drive
        if (Math.random() < currentHomeProb * 0.6) {
          const isTD = Math.random() > 0.3
          homeScore += isTD ? 7 : 3
          logs.push({ time: `Drive ${i+1}`, text: `Ev Sahibi ${isTD ? 'TOUCHDOWN (7 sayı)' : 'FIELD GOAL (3 sayı)'} buldu. ${homeTac.off_focus === 'deep_bomb' ? 'Derin paslarla geldiler!' : ''}` })
        }
        
        // Away Drive
        if (Math.random() < currentAwayProb * 0.6) {
          const isTD = Math.random() > 0.3
          awayScore += isTD ? 7 : 3
          logs.push({ time: `Drive ${i+1}`, text: `Deplasman ${isTD ? 'TOUCHDOWN (7 sayı)' : 'FIELD GOAL (3 sayı)'} buldu.` })
        }

        // Aggressiveness Penalty (Flags)
        if (homeTac.x_aggressiveness === 'physical' && Math.random() < 0.2) {
          logs.push({ time: `Drive ${i+1}`, text: `Ev sahibi gereksiz sertlikten ceza yedi ve pozisyon kaybetti.` })
        }
      }

      // Tie breaker
      if (homeScore === awayScore) {
        if (Math.random() < baseHomeWinProb) {
          homeScore += 3
          logs.push({ time: "OT", text: "Uzatmalarda Ev Sahibi FG ile kazandı!" })
        } else {
          awayScore += 3
          logs.push({ time: "OT", text: "Uzatmalarda Deplasman FG ile kazandı!" })
        }
      }

      // 4. Update Match
      await supabaseAdmin.from('matches').update({
        home_score: homeScore,
        away_score: awayScore,
        final_stats: { 
          played: true, 
          summary: `Taktiksel Çarpışma! Home Güç: ${finalHomePower.toFixed(1)}, Away Güç: ${finalAwayPower.toFixed(1)}` 
        }
      }).eq('id', match.id)

      // 5. Match Logs
      await supabaseAdmin.from('match_drive_logs').insert({
        match_id: match.id,
        plays: logs,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })

      // 6. Economy
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

    return new Response(JSON.stringify({ success: true, message: `Hafta ${week} Taktiksel Maç Motoru ile simüle edildi.` }), {
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
