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

    const { name, is_public, password } = await req.json()
    if (!name || name.trim().length === 0) throw new Error('Lig ismi gerekli')

    // Ensure user exists in public.users
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (!existingUser) {
      // Auto-create public.users record
      await supabaseAdmin.from('users').insert({
        id: user.id,
        email: user.email,
        username: user.user_metadata?.username || 'Manager_' + user.id.substring(0, 6)
      })
    }

    // 1. Create League
    const { data: league, error: lErr } = await supabaseAdmin.from('leagues').insert({
      name: name.trim(),
      match_time_utc: '14:00:00',
      is_public: is_public !== false,
      owner_user_id: user.id,
      status: 'waiting',
    }).select().single()

    if (lErr) throw lErr

    // 2. Create Franchise for the commissioner
    const { data: franchise, error: fErr } = await supabaseAdmin.from('franchises').insert({
      league_id: league.id,
      user_id: user.id,
      team_name: `${user.user_metadata?.username || 'Menajer'} Team`,
      city: 'New City',
      club_fund: 100000
    }).select().single()

    if (fErr) {
      // Rollback league if franchise fails
      await supabaseAdmin.from('leagues').delete().eq('id', league.id)
      throw fErr
    }

    return new Response(JSON.stringify({ 
      success: true, 
      league, 
      franchise 
    }), {
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
