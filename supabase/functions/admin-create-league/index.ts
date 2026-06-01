import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"
import { generateTraits, calculatePlayerValue } from "../_shared/playerUtils.ts"

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
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 })
    }

    // Check if admin
    const { data: profile } = await supabaseClient.from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 })
    }

    const { name, mode } = await req.json()

    // Service role client to bypass RLS for bot creation
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Create League
    const { data: league, error: leagueErr } = await supabaseAdmin.from('leagues').insert({
      name: name || 'Admin Test Ligi',
      match_time_utc: '20:00',
      owner_user_id: user.id,
      status: 'waiting'
    }).select().single()

    if (leagueErr) throw leagueErr

    // 2. Create Admin Franchise
    const { data: adminFranchise, error: fErr } = await supabaseAdmin.from('franchises').insert({
      league_id: league.id,
      user_id: user.id,
      team_name: 'Admin Team',
      city: 'Test City',
      club_fund: 200000
    }).select().single()

    if (fErr) throw fErr

    // Helper to generate 53 players
    const generateRoster = async (franchiseId: string) => {
      const positions = [
        { pos: 'QB', count: 3 }, { pos: 'RB', count: 4 }, { pos: 'WR', count: 6 },
        { pos: 'TE', count: 3 }, { pos: 'OL', count: 10 }, { pos: 'DE', count: 5 },
        { pos: 'LB', count: 7 }, { pos: 'CB', count: 6 }, { pos: 'S', count: 6 },
        { pos: 'K', count: 3 }
      ]
      const playersToInsert = []
      for (const p of positions) {
        for (let i = 0; i < p.count; i++) {
          const overall = Math.floor(Math.random() * 20) + 60 // 60-79 OVR
          const baseValue = overall * 100000
          const traits = generateTraits(overall, p.pos)
          const finalValue = calculatePlayerValue(baseValue, traits.length)
          playersToInsert.push({
            franchise_id: franchiseId,
            name: `${p.pos} Player ${Math.floor(Math.random() * 1000)}`,
            position: p.pos,
            overall: overall,
            value: finalValue,
            traits: traits
          })
        }
      }
      const { error } = await supabaseAdmin.from('players').insert(playersToInsert)
      if (error) console.error("Roster generation error:", error)
    }

    // Generate roster for Admin
    await generateRoster(adminFranchise.id)

    // Generate 50 Free Agents
    const generateFreeAgents = async () => {
      const positions = ['QB', 'RB', 'WR', 'TE', 'OL', 'DE', 'LB', 'CB', 'S', 'K']
      const playersToInsert = []
      for (let i = 0; i < 50; i++) {
        const pos = positions[Math.floor(Math.random() * positions.length)]
        const overall = Math.floor(Math.random() * 20) + 70 // 70-89 OVR (Good players for market)
        const baseValue = overall * 150000
        const traits = generateTraits(overall, pos)
        const finalValue = calculatePlayerValue(baseValue, traits.length)
        playersToInsert.push({
          franchise_id: null,
          name: `FA ${pos} ${Math.floor(Math.random() * 1000)}`,
          position: pos,
          overall: overall,
          value: finalValue,
          traits: traits
        })
      }
      await supabaseAdmin.from('players').insert(playersToInsert)
    }
    await generateFreeAgents()

    // 3. Create Bots if Test Modu
    if (mode === 'test') {
      const botNames = ['Bot Alpha', 'Bot Bravo', 'Bot Charlie', 'Bot Delta', 'Bot Echo', 'Bot Foxtrot', 'Bot Golf']
      for (const botName of botNames) {
        let { data: botUser } = await supabaseAdmin.from('users').select('id').eq('username', botName).single()
        
        if (!botUser) {
          const botId = crypto.randomUUID()
          await supabaseAdmin.from('users').insert({
            id: botId,
            email: `${botName.replace(' ', '').toLowerCase()}@bot.nflmanager.com`,
            username: botName,
            role: 'bot'
          })
          botUser = { id: botId }
        }

        const { data: botFranchise, error: botFErr } = await supabaseAdmin.from('franchises').insert({
          league_id: league.id,
          user_id: botUser.id,
          team_name: `${botName} Team`,
          city: 'Bot City',
          club_fund: 100000
        }).select().single()
        
        if (botFranchise) {
          await generateRoster(botFranchise.id)
        }
      }
      
      // Update league status
      await supabaseAdmin.from('leagues').update({ status: 'active' }).eq('id', league.id)
      
      // Generate fixtures for the league!
      await supabaseAdmin.rpc('generate_fixtures', { p_league_id: league.id })
    }

    return new Response(JSON.stringify({ success: true, league }), {
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
