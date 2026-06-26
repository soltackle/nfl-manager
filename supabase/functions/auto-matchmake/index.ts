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
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Auth Header')
    const token = authHeader.replace('Bearer ', '')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token)
    if (userError || !userData?.user) throw new Error('Invalid token')
    const user = userData.user

    const { team_name, city, target } = await req.json()
    if (!team_name || !city) throw new Error('Takım Adı ve Şehir zorunludur')

    // 1. Check if user already has an active or waiting franchise
    // Actually, users can have multiple franchises. But let's check if they exceed 4 slots.
    const { data: userFranchises } = await supabaseAdmin.from('franchises').select('id').eq('user_id', user.id)
    if (userFranchises && userFranchises.length >= 4) {
      throw new Error('Maksimum kariyer slotu sınırına ulaştınız (4).')
    }

    // 2. Find an available league (status = waiting, members < 8)
    // We need to count members for waiting leagues
    const { data: waitingLeagues } = await supabaseAdmin
      .from('leagues')
      .select('id, name, matchmaking_start_time')
      .eq('status', 'waiting')
      .eq('is_public', true)
      .order('created_at', { ascending: true })

    let matchedLeagueId = null
    let _isNewLeague = false

    if (target) {
      // Direct join
      const { data: targetLeague } = await supabaseAdmin.from('leagues').select('*').eq('id', target).eq('status', 'waiting').single()
      if (!targetLeague) throw new Error('Bu lig artık katılıma açık değil veya bulunamadı.')
      
      const { data: userInLeague } = await supabaseAdmin.from('franchises').select('id').eq('league_id', target).eq('user_id', user.id).single()
      if (userInLeague) throw new Error('Bu lige zaten katıldınız.')
      
      const { count } = await supabaseAdmin.from('franchises').select('*', { count: 'exact', head: true }).eq('league_id', target)
      if (count !== null && count >= 8) throw new Error('Bu ligin kapasitesi dolu.')

      matchedLeagueId = target
    } else {
      if (waitingLeagues && waitingLeagues.length > 0) {
        for (const league of waitingLeagues) {
          // 1. Check if user is already in this league
          const { data: userInLeague } = await supabaseAdmin
            .from('franchises')
            .select('id')
            .eq('league_id', league.id)
            .eq('user_id', user.id)
            .single()
            
          if (userInLeague) {
            continue // Skip this league, user is already in it
          }

          // 2. Check if league has space
          const { count } = await supabaseAdmin
            .from('franchises')
            .select('*', { count: 'exact', head: true })
            .eq('league_id', league.id)

          if (count !== null && count < 8) {
            matchedLeagueId = league.id
            break
          }
        }
      }
    }

    // 3. If no league found, create a new one
    if (!matchedLeagueId) {
      const { data: newLeague, error: lErr } = await supabaseAdmin.from('leagues').insert({
        name: `Genel Lig ${Math.floor(Math.random() * 10000)}`,
        status: 'waiting',
        is_public: true,
        owner_user_id: user.id, // The first user is technically the "owner" or "host"
        matchmaking_start_time: new Date().toISOString(),
        match_time_utc: '20:00:00'
      }).select().single()

      if (lErr) throw lErr
      matchedLeagueId = newLeague.id
      _isNewLeague = true
    }

    // 4. Join the league
    const { data: newFranchise, error: fErr } = await supabaseAdmin.from('franchises').insert({
      team_name,
      city,
      league_id: matchedLeagueId,
      user_id: user.id,
      budget: 100000000,
      club_fund: 0,
      morale: 100
    }).select().single()

    if (fErr) throw fErr

    // 5. If this join made it 8 players, trigger league-start-team-creation
    const { count: finalCount } = await supabaseAdmin.from('franchises').select('*', { count: 'exact', head: true }).eq('league_id', matchedLeagueId)
    
    if (finalCount === 8) {
      // Trigger team creation
      await supabaseAdmin.functions.invoke('league-start-team-creation', {
        body: { league_id: matchedLeagueId }
      })
    }

    return new Response(JSON.stringify({ success: true, franchise: newFranchise, league_id: matchedLeagueId }), {
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
