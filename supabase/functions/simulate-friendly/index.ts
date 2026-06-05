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
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error("Missing Authorization header")
    const token = authHeader.replace('Bearer ', '')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
    if (authErr || !user) throw new Error("Unauthorized")

    const { target_franchise_id, league_id } = await req.json()
    if (!target_franchise_id || !league_id) throw new Error("Missing required parameters")

    // 1. Get user and balance
    const { data: dbUser } = await supabaseAdmin.from('users').select('amfutcoin').eq('id', user.id).single()
    if (!dbUser || dbUser.amfutcoin < 4) {
      throw new Error("Yetersiz AmFutCoin bakiyesi")
    }

    // 2. Get user's franchise in this league
    const { data: homeFranchise } = await supabaseAdmin.from('franchises').select('id, team_name').eq('user_id', user.id).eq('league_id', league_id).single()
    if (!homeFranchise) throw new Error("Kendi takımınız bulunamadı")

    // 3. Get target franchise
    const { data: awayFranchise } = await supabaseAdmin.from('franchises').select('id, team_name').eq('id', target_franchise_id).single()
    if (!awayFranchise) throw new Error("Rakip takım bulunamadı")

    // 4. Calculate Powers
    const { data: homePlayers } = await supabaseAdmin.from('players').select('id, overall, progression').eq('franchise_id', homeFranchise.id)
    const { data: awayPlayers } = await supabaseAdmin.from('players').select('overall').eq('franchise_id', awayFranchise.id)

    const getPower = (players: any[]) => {
      if (!players || players.length === 0) return 50
      const sorted = [...players].sort((a, b) => b.overall - a.overall).slice(0, 11)
      return sorted.reduce((sum, p) => sum + p.overall, 0) / sorted.length
    }

    const homeOffPower = getPower(homePlayers || [])
    const homeDefPower = getPower(homePlayers || [])
    const awayOffPower = getPower(awayPlayers || [])
    const awayDefPower = getPower(awayPlayers || [])
    
    const diff = (homeOffPower + homeDefPower) - (awayOffPower + awayDefPower)
    
    // Base chances
    let homeScore = Math.floor(Math.random() * 21) + 7
    let awayScore = Math.floor(Math.random() * 21) + 7

    if (diff > 5) {
      homeScore += Math.floor(Math.random() * 14) + 7
      awayScore = Math.max(0, awayScore - 7)
    } else if (diff < -5) {
      awayScore += Math.floor(Math.random() * 14) + 7
      homeScore = Math.max(0, homeScore - 7)
    }

    // Prevent ties in American Football (very rare)
    if (homeScore === awayScore) {
      homeScore += 3
    }

    // 6. Deduct 4 Coins & Update Quests
    await supabaseAdmin.from('users').update({ amfutcoin: dbUser.amfutcoin - 4 }).eq('id', user.id)
    
    const today = new Date().toISOString().split('T')[0]
    const { data: quests } = await supabaseAdmin.from('user_quests').select('*').eq('user_id', user.id).single()
    if (quests && quests.last_reset_date === today) {
      await supabaseAdmin.from('user_quests').update({ friendly_played: (quests.friendly_played || 0) + 1 }).eq('user_id', user.id)
    }

    // 7. Add XP to home players
    if (homePlayers && homePlayers.length > 0) {
      // Pick 11 random players to give +1 to +5 progression
      const shuffled = [...homePlayers].sort(() => 0.5 - Math.random()).slice(0, 11)
      for (const p of shuffled) {
        const xpGain = Math.floor(Math.random() * 5) + 1
        let newProg = (p.progression || 0) + xpGain
        let newOverall = p.overall
        if (newProg >= 100) {
          newProg -= 100
          newOverall += 1
        }
        await supabaseAdmin.from('players').update({ progression: newProg, overall: newOverall }).eq('id', p.id)
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      stats: {
        homeScore,
        awayScore,
        awayTeamName: awayFranchise.team_name
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, // Important: return 200 so our frontend fetch doesn't throw generic 500
    })
  }
})
