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

    // Verify admin
    const { data: dbUser } = await supabaseAdmin.from('users').select('role').eq('id', user.id).single()
    if (!dbUser || dbUser.role !== 'admin') throw new Error('Unauthorized')

    const { league_id } = await req.json()
    if (!league_id) throw new Error('league_id required')

    // Get current franchises
    const { data: franchises } = await supabaseAdmin.from('franchises').select('id').eq('league_id', league_id)
    const currentCount = franchises?.length || 0
    const missingCount = 8 - currentCount

    if (missingCount <= 0) {
      throw new Error('Lig zaten dolu')
    }

    const botCities = ['Los Angeles', 'Miami', 'Chicago', 'Dallas', 'Seattle', 'Denver', 'Boston']
    const botMascots = ['Tigers', 'Sharks', 'Dragons', 'Panthers', 'Cobras', 'Knights', 'Eagles']

    for (let i = 0; i < missingCount; i++) {
      // Create a fake bot user
      const botId = crypto.randomUUID()
      await supabaseAdmin.from('users').insert({
        id: botId,
        email: `bot_${botId.substring(0,6)}@nflmanager.local`,
        username: `Bot_${i+1}`,
        role: 'bot'
      })

      // Create franchise for bot
      await supabaseAdmin.from('franchises').insert({
        league_id,
        user_id: botId,
        team_name: `${botCities[i % botCities.length]} ${botMascots[i % botMascots.length]}`,
        city: botCities[i % botCities.length],
        club_fund: 100000,
        is_ready: true
      })
    }

    // Set league to draft waiting mode (this will trigger countdown in lobby)
    await supabaseAdmin.from('leagues').update({ status: 'waiting' }).eq('id', league_id)

    return new Response(JSON.stringify({ success: true, message: `${missingCount} bot eklendi` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: unknown) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})
