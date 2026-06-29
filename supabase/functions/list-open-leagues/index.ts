import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Returns all joinable (status='waiting') leagues with member counts, for the
// manual league browser. Both public and private leagues are listed, but the
// password itself is NEVER returned (only `has_password`). Joining a private
// league is verified server-side in auto-matchmake.
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
    let userId: string | null = null
    if (authHeader) {
      const { data } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''))
      userId = data?.user?.id ?? null
    }

    const { data: leagues, error } = await supabaseAdmin
      .from('leagues')
      .select('id, name, is_public, password, owner_user_id, matchmaking_start_time, created_at')
      .eq('status', 'waiting')
      .order('created_at', { ascending: false })

    if (error) throw error

    const ids = (leagues || []).map(l => l.id)
    const counts: Record<string, number> = {}
    const myLeagues = new Set<string>()
    if (ids.length > 0) {
      const { data: fr } = await supabaseAdmin
        .from('franchises').select('league_id, user_id').in('league_id', ids)
      for (const f of (fr || [])) {
        counts[f.league_id] = (counts[f.league_id] || 0) + 1
        if (userId && f.user_id === userId) myLeagues.add(f.league_id)
      }
    }

    const result = (leagues || []).map(l => ({
      id: l.id,
      name: l.name,
      is_public: l.is_public,
      has_password: !!l.password,
      owner_user_id: l.owner_user_id,
      members: counts[l.id] || 0,
      max: 8,
      is_owner: userId != null && l.owner_user_id === userId,
      already_joined: myLeagues.has(l.id),
      created_at: l.created_at
    }))
      // Hide already-full leagues from the browser
      .filter(l => l.members < 8)

    return new Response(JSON.stringify({ leagues: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: unknown) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})
