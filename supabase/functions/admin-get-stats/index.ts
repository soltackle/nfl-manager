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
    const token = authHeader.replace('Bearer ', '')

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    if (userError || !user) throw new Error('Invalid token')

    const { data: dbUser } = await supabaseAdmin.from('users').select('role').eq('id', user.id).single()
    if (!dbUser || dbUser.role !== 'admin') throw new Error('Unauthorized')

    // Get true user count bypassing RLS
    const { count: usersCount } = await supabaseAdmin.from('users').select('*', { count: 'exact', head: true })
    const { count: leaguesCount } = await supabaseAdmin.from('leagues').select('*', { count: 'exact', head: true })
    const { count: matchesCount } = await supabaseAdmin.from('matches').select('*', { count: 'exact', head: true }).eq('final_stats->>played', 'true')
    
    // Get all leagues to display in the admin panel
    const { data: leaguesList, error: lqErr } = await supabaseAdmin.from('leagues').select('id, name, status, created_at').order('created_at', { ascending: false })
    if (lqErr) throw lqErr

    // To get Google users, we can list users from auth admin API
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
    
    let googleUsersCount = 0
    if (authUsers && authUsers.users) {
      googleUsersCount = authUsers.users.filter(u => 
        u.app_metadata && u.app_metadata.providers && u.app_metadata.providers.includes('google')
      ).length
    }

    return new Response(
      JSON.stringify({
        users: usersCount || 0,
        googleUsers: googleUsersCount || 0,
        leagues: leaguesCount || 0,
        leaguesList: leaguesList || [],
        matches: matchesCount || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
