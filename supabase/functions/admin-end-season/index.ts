import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const { data: userData } = await supabaseClient.from('users').select('role').eq('id', user.id).single()
    if (userData?.role !== 'admin') throw new Error("Only admins can end the season")

    const { league_id } = await req.json()
    if (!league_id) throw new Error("league_id required")

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Calculate Standings
    const { data: franchises } = await supabaseAdmin.from('franchises').select('id, user_id, club_fund').eq('league_id', league_id)
    if (!franchises) throw new Error("No franchises found")

    const { data: matches } = await supabaseAdmin.from('matches').select('home_franchise_id, away_franchise_id, home_score, away_score').eq('league_id', league_id).not('final_stats', 'is', null)
    
    const standings = franchises.map(f => ({ ...f, wins: 0, pointDiff: 0 }))
    
    if (matches) {
      for (const m of matches) {
        const home = standings.find(s => s.id === m.home_franchise_id)
        const away = standings.find(s => s.id === m.away_franchise_id)
        if (!home || !away) continue

        home.pointDiff += (m.home_score - m.away_score)
        away.pointDiff += (m.away_score - m.home_score)
        
        if (m.home_score > m.away_score) home.wins++
        else if (m.home_score < m.away_score) away.wins++
      }
    }

    // Sort by wins, then point diff
    standings.sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins
      return b.pointDiff - a.pointDiff
    })

    // 2. Distribute Rewards (Top 3)
    const rewards = [
      { club: 10000000, coin: 5000 }, // 1st
      { club: 5000000, coin: 2500 },  // 2nd
      { club: 2500000, coin: 1000 }   // 3rd
    ]

    for (let i = 0; i < Math.min(3, standings.length); i++) {
      const team = standings[i]
      const reward = rewards[i]
      
      // Add club fund
      await supabaseAdmin.from('franchises').update({ club_fund: team.club_fund + reward.club }).eq('id', team.id)
      
      // Add AmFutCoin
      const { data: userRow } = await supabaseAdmin.from('users').select('amfutcoin').eq('id', team.user_id).single()
      if (userRow) {
        await supabaseAdmin.from('users').update({ amfutcoin: userRow.amfutcoin + reward.coin }).eq('id', team.user_id)
      }
    }

    // 3. Delete old matches and logs
    if (matches && matches.length > 0) {
      // First get all match IDs
      const { data: allMatches } = await supabaseAdmin.from('matches').select('id').eq('league_id', league_id)
      if (allMatches) {
        const matchIds = allMatches.map(m => m.id)
        // Delete logs first to avoid foreign key issues
        if (matchIds.length > 0) {
           // We can't delete by array directly easily in supabase v2 without in filter
           for(let i=0; i<matchIds.length; i+=100) {
             const batch = matchIds.slice(i, i+100)
             await supabaseAdmin.from('match_drive_logs').delete().in('match_id', batch)
           }
        }
      }
      // Then delete matches
      await supabaseAdmin.from('matches').delete().eq('league_id', league_id)
    }

    // 4. Set league to Draft mode for next season
    await supabaseAdmin.from('leagues').update({ status: 'draft' }).eq('id', league_id)

    // Reset draft session so a new one can be created
    await supabaseAdmin.from('draft_sessions').delete().eq('league_id', league_id)

    return new Response(JSON.stringify({ success: true, message: `Sezon sona erdi. Ödüller dağıtıldı ve lig draft aşamasına döndü!` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: unknown) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
