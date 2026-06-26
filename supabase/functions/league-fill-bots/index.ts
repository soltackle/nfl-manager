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

    // Verify league ownership or if 60 mins passed
    const { data: league, error: lErr } = await supabaseAdmin
      .from('leagues')
      .select('id, owner_user_id, status, matchmaking_start_time')
      .eq('id', league_id)
      .single()

    if (lErr || !league) throw new Error('League not found')
    
    // We allow either the owner to fill bots manually, or anyone if 60 mins have passed
    let canFill = false
    if (league.owner_user_id === user.id) canFill = true
    if (league.matchmaking_start_time) {
       const start = new Date(league.matchmaking_start_time).getTime()
       if (Date.now() - start >= 60 * 60 * 1000) {
         canFill = true
       }
    }

    if (!canFill) throw new Error('Yalnızca komisyoner veya süre dolduğunda bot doldurulabilir')
    if (league.status !== 'waiting') throw new Error('League is no longer waiting for players')

    // Count existing franchises
    const { data: franchises } = await supabaseAdmin.from('franchises').select('id').eq('league_id', league_id)
    const currentCount = franchises?.length || 0
    const needed = 8 - currentCount

    if (needed > 0) {
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

        await supabaseAdmin.from('franchises').insert({
          league_id: league.id,
          user_id: botUser.id,
          team_name: `${botName} Team`,
          city: 'Bot City',
          budget: 100000000,
          club_fund: 0,
          morale: 100,
          is_ready: true
        })
      }
    }

    // Now it should be exactly 8 teams
    const { data: finalFranchises } = await supabaseAdmin.from('franchises').select('id').eq('league_id', league_id)
    if (finalFranchises && finalFranchises.length === 8) {
      await supabaseAdmin.from('leagues').update({ status: 'team_creation' }).eq('id', league_id)
      
      const functionUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/league-start-team-creation`
      await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'X-Internal-Secret': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ league_id })
      })
    }

    return new Response(JSON.stringify({ success: true, filled: needed }), {
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
