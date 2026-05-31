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
    // This endpoint should be called via cron job, e.g. Vercel Cron or pg_cron
    // Using service role key to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Optional: Protect this route with a CRON_SECRET if called from Vercel
    const authHeader = req.headers.get('Authorization')
    const cronSecret = Deno.env.get('CRON_SECRET')
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      throw new Error('Unauthorized cron execution')
    }

    const logs: string[] = []

    // ==========================================
    // 1. DRAFT AUTOMATION (WAITING LEAGUES)
    // ==========================================
    const { data: waitingLeagues } = await supabaseAdmin.from('leagues').select('id, name').eq('status', 'waiting')
    
    if (waitingLeagues) {
      for (const league of waitingLeagues) {
        const { data: franchises } = await supabaseAdmin.from('franchises').select('id').eq('league_id', league.id)
        
        if (franchises && franchises.length === 8) {
          logs.push(`Starting draft for full league: ${league.name}`)
          
          const positions = ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'DB']
          for (const franchise of franchises) {
            const playersToInsert = []
            for (let i = 0; i < 22; i++) {
              const pos = positions[i % positions.length]
              playersToInsert.push({
                franchise_id: franchise.id,
                first_name: 'Drafted',
                last_name: `Player_${i}`,
                position: pos,
                age: 20 + Math.floor(Math.random() * 10),
                overall: 60 + Math.floor(Math.random() * 30),
                potential: 70 + Math.floor(Math.random() * 25),
                status: 'roster'
              })
            }
            await supabaseAdmin.from('players').insert(playersToInsert)
          }

          // Generate fixtures
          await supabaseAdmin.rpc('generate_fixtures', { p_league_id: league.id })

          // Activate league
          await supabaseAdmin.from('leagues').update({ status: 'active' }).eq('id', league.id)
          logs.push(`Draft completed and league active: ${league.name}`)
        }
      }
    }

    // ==========================================
    // 2. MATCH AUTOMATION (ACTIVE LEAGUES)
    // ==========================================
    const { data: activeLeagues } = await supabaseAdmin.from('leagues').select('id, name').eq('status', 'active')

    if (activeLeagues) {
      for (const league of activeLeagues) {
        // Find the first unplayed match to determine current week
        // We look for matches where final_stats is either empty or does not have played: true
        const { data: nextMatch } = await supabaseAdmin
          .from('matches')
          .select('week')
          .eq('league_id', league.id)
          .filter('home_score', 'eq', 0)
          .filter('away_score', 'eq', 0)
          .order('week', { ascending: true })
          .limit(1)
          .maybeSingle()

        if (nextMatch) {
          const currentWeek = nextMatch.week
          logs.push(`Simulating week ${currentWeek} for league: ${league.name}`)

          const { data: matches } = await supabaseAdmin
            .from('matches')
            .select('*, home_franchise_id, away_franchise_id')
            .eq('league_id', league.id)
            .eq('week', currentWeek)

          if (matches) {
            for (const match of matches) {
              const { data: homePlayers } = await supabaseAdmin.from('players').select('overall').eq('franchise_id', match.home_franchise_id)
              const { data: awayPlayers } = await supabaseAdmin.from('players').select('overall').eq('franchise_id', match.away_franchise_id)
              
              const getTeamPower = (players: any[]) => {
                if (!players || players.length === 0) return 50
                const sorted = players.sort((a, b) => b.overall - a.overall).slice(0, 11)
                return sorted.reduce((sum, p) => sum + p.overall, 0) / sorted.length
              }

              const homeBasePower = getTeamPower(homePlayers)
              const awayBasePower = getTeamPower(awayPlayers)

              const { data: stadium } = await supabaseAdmin.from('stadiums').select('turf_level').eq('franchise_id', match.home_franchise_id).maybeSingle()
              let homeAdvantage = 1.05
              if (stadium) {
                if (stadium.turf_level === 1) homeAdvantage += 0.02
                if (stadium.turf_level === 2) homeAdvantage += 0.04
                if (stadium.turf_level === 3) homeAdvantage += 0.06
              }

              const finalHomePower = homeBasePower * homeAdvantage
              const finalAwayPower = awayBasePower
              const totalPower = finalHomePower + finalAwayPower
              const homeWinProb = finalHomePower / totalPower

              let homeScore = 0
              let awayScore = 0

              for (let i = 0; i < 10; i++) {
                if (Math.random() < homeWinProb * 0.6) homeScore += Math.random() > 0.3 ? 7 : 3
                if (Math.random() < (1 - homeWinProb) * 0.6) awayScore += Math.random() > 0.3 ? 7 : 3
              }

              if (homeScore === awayScore) {
                if (Math.random() < homeWinProb) homeScore += 3; else awayScore += 3;
              }

              await supabaseAdmin.from('matches').update({
                home_score: homeScore,
                away_score: awayScore,
                final_stats: { played: true, summary: `Auto Match. Home: ${finalHomePower.toFixed(1)}, Away: ${finalAwayPower.toFixed(1)}` }
              }).eq('id', match.id)

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

              const { data: capStadium } = await supabaseAdmin.from('stadiums').select('capacity_level').eq('franchise_id', match.home_franchise_id).maybeSingle()
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
          }
        } else {
          // No unplayed matches found, league might be completed
          logs.push(`No unplayed matches found for league: ${league.name}, maybe playoffs or completed.`)
        }
      }
    }

    return new Response(JSON.stringify({ success: true, logs }), {
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
