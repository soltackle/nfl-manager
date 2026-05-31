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

    const { league_id } = await req.json()
    if (!league_id) throw new Error('league_id gerekli')

    // Ensure user exists in public.users
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (!existingUser) {
      await supabaseAdmin.from('users').insert({
        id: user.id,
        email: user.email,
        username: user.user_metadata?.username || 'Manager_' + user.id.substring(0, 6)
      })
    }

    // Check league exists and is open
    const { data: league, error: lErr } = await supabaseAdmin
      .from('leagues')
      .select('*, franchises(id, user_id)')
      .eq('id', league_id)
      .single()

    if (lErr || !league) throw new Error('Lig bulunamadı')
    if (league.status !== 'waiting') throw new Error('Bu lig artık katılıma kapalı')
    
    const memberCount = league.franchises?.length || 0
    if (memberCount >= 8) throw new Error('Bu lig dolu (8/8)')

    // Check if already a member
    const alreadyJoined = league.franchises?.some((f: any) => f.user_id === user.id)
    if (alreadyJoined) throw new Error('Bu lige zaten katıldınız')

    // Create franchise
    const { data: franchise, error: fErr } = await supabaseAdmin.from('franchises').insert({
      league_id,
      user_id: user.id,
      team_name: `${user.user_metadata?.username || 'Menajer'} Team`,
      city: 'New City',
      club_fund: 100000
    }).select().single()

    if (fErr) throw fErr

    return new Response(JSON.stringify({ 
      success: true, 
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
