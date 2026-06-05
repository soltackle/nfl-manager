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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Auth Header')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''))
    if (userError || !user) throw new Error('Invalid token')

    const { league_id } = await req.json()
    if (!league_id) throw new Error('league_id required')

    // Verify league ownership
    const { data: league, error: lErr } = await supabaseAdmin
      .from('leagues')
      .select('id, owner_user_id, status')
      .eq('id', league_id)
      .single()

    if (lErr || !league) throw new Error('League not found')
    if (league.owner_user_id !== user.id) throw new Error('Only the commissioner can fill bots')
    if (league.status !== 'waiting') throw new Error('League is no longer waiting for players')

    // Count existing franchises
    const { data: franchises } = await supabaseAdmin.from('franchises').select('id').eq('league_id', league_id)
    const currentCount = franchises?.length || 0
    const needed = 8 - currentCount

    if (needed <= 0) {
      return new Response(JSON.stringify({ success: true, message: 'League is already full' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

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

    const botNames = ['Bot Alpha', 'Bot Bravo', 'Bot Charlie', 'Bot Delta', 'Bot Echo', 'Bot Foxtrot', 'Bot Golf']
    
    for (let i = 0; i < needed; i++) {
      const botName = botNames[i % botNames.length] + ' ' + Math.floor(Math.random() * 1000)
      
      let { data: botUser } = await supabaseAdmin.from('users').select('id').eq('username', botName).single()
      
      if (!botUser) {
        const botId = crypto.randomUUID()
        await supabaseAdmin.from('users').insert({
          id: botId,
          email: `${botName.replace(/\s/g, '').toLowerCase()}@bot.nflmanager.com`,
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

    return new Response(JSON.stringify({ success: true, filled: needed }), {
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
