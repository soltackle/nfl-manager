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

    // Using admin token for Cron or Admin dashboard
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Auth Header')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''))
    if (userError || !user) throw new Error('Invalid token')

    const { league_id, week } = await req.json()

    // Get matches for the given week in the league
    const { data: matches, error: matchErr } = await supabaseAdmin
      .from('matches')
      .select('*, home_franchise_id, away_franchise_id')
      .eq('league_id', league_id)
      .eq('week', week)

    if (matchErr || !matches) throw new Error('Matches not found')

    for (const match of matches) {
      // 1. Get Home and Away Franchises
      const { data: homePlayers } = await supabaseAdmin.from('players').select('overall').eq('franchise_id', match.home_franchise_id)
      const { data: awayPlayers } = await supabaseAdmin.from('players').select('overall').eq('franchise_id', match.away_franchise_id)
      
      const getTeamPower = (players: any[]) => {
        if (!players || players.length === 0) return 50
        // Top 11 players average
        const sorted = players.sort((a, b) => b.overall - a.overall).slice(0, 11)
        return sorted.reduce((sum, p) => sum + p.overall, 0) / sorted.length
      }

      const homeBasePower = getTeamPower(homePlayers)
      const awayBasePower = getTeamPower(awayPlayers)

      // 2. Get Home Stadium Advantage
      const { data: stadium } = await supabaseAdmin.from('stadiums').select('turf_level').eq('franchise_id', match.home_franchise_id).single()
      
      let homeAdvantage = 1.05 // Base 5% home advantage
      if (stadium) {
        if (stadium.turf_level === 1) homeAdvantage += 0.02
        if (stadium.turf_level === 2) homeAdvantage += 0.04
        if (stadium.turf_level === 3) homeAdvantage += 0.06
      }

      const finalHomePower = homeBasePower * homeAdvantage
      const finalAwayPower = awayBasePower

      // 3. RNG Match Engine
      // Normalize power to determine win probability
      const totalPower = finalHomePower + finalAwayPower
      const homeWinProb = finalHomePower / totalPower

      // Generate scores based on probability
      let homeScore = 0
      let awayScore = 0

      // 10 "Drives" per team
      for (let i = 0; i < 10; i++) {
        // Home drive
        if (Math.random() < homeWinProb * 0.6) {
          homeScore += Math.random() > 0.3 ? 7 : 3 // TD or FG
        }
        // Away drive
        if (Math.random() < (1 - homeWinProb) * 0.6) {
          awayScore += Math.random() > 0.3 ? 7 : 3
        }
      }

      // Ensure no ties (simplified OT)
      if (homeScore === awayScore) {
        if (Math.random() < homeWinProb) homeScore += 3; else awayScore += 3;
      }

      // 4. Update Match
      await supabaseAdmin.from('matches').update({
        home_score: homeScore,
        away_score: awayScore,
        final_stats: { 
          played: true, 
          summary: `Home Power: ${finalHomePower.toFixed(1)}, Away Power: ${finalAwayPower.toFixed(1)}` 
        }
      }).eq('id', match.id)

      // 5. Generate Match Logs
      await supabaseAdmin.from('match_drive_logs').insert({
        match_id: match.id,
        plays: [
          { time: "1Q 15:00", text: "Maç başladı." },
          { time: "2Q 05:00", text: `Ev Sahibi takım sayıları buluyor. Skor: ${homeScore}` },
          { time: "4Q 02:00", text: `Deplasman takımı cevap veriyor. Skor: ${awayScore}` },
          { time: "End", text: "Maç bitti." }
        ],
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })

      // 6. Economy - Award Club Funds
      // Gate Revenue for Home
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

      // Away Revenue (Fixed 80K)
      const { data: awayFranchise } = await supabaseAdmin.from('franchises').select('club_fund').eq('id', match.away_franchise_id).single()
      if (awayFranchise) {
        await supabaseAdmin.from('franchises').update({ club_fund: awayFranchise.club_fund + 80000 }).eq('id', match.away_franchise_id)
      }
    }

    return new Response(JSON.stringify({ success: true, message: `Hafta ${week} Gelişmiş Motor ile simüle edildi.` }), {
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
