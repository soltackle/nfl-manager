import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

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
    const { error: fErr } = await supabaseAdmin.from('franchises').insert({
      league_id: league.id,
      user_id: user.id,
      team_name: 'Admin Team',
      city: 'Test City',
      club_fund: 200000
    })

    if (fErr) throw fErr

    // 3. Create Bots if Test Modu
    if (mode === 'test') {
      const botNames = ['Bot Alpha', 'Bot Bravo', 'Bot Charlie', 'Bot Delta', 'Bot Echo', 'Bot Foxtrot', 'Bot Golf']
      for (const botName of botNames) {
        // Find or create bot user
        let { data: botUser } = await supabaseAdmin.from('users').select('id').eq('username', botName).single()
        
        if (!botUser) {
          // Since we can't easily create auth users via SQL without email, we'll just insert a dummy row in public.users
          // NOTE: Real auth users have an id matching auth.users, but for bots we can generate a random UUID
          const botId = crypto.randomUUID()
          await supabaseAdmin.from('users').insert({
            id: botId,
            email: `${botName.replace(' ', '').toLowerCase()}@bot.nflmanager.com`,
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
          club_fund: 100000
        })
      }
      
      // Update league status
      await supabaseAdmin.from('leagues').update({ status: 'draft' }).eq('id', league.id)
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
