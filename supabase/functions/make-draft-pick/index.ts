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

    const { franchise_id, session_id, player_id } = await req.json()

    // 1. Verify franchise belongs to user
    const { data: franchise, error: fErr } = await supabaseAdmin
      .from('franchises')
      .select('id, league_id')
      .eq('id', franchise_id)
      .eq('user_id', user.id)
      .single()

    if (!franchise || fErr) throw new Error('Unauthorized franchise')

    // 2. Verify draft session is active and it's this franchise's turn
    const { data: session, error: sErr } = await supabaseAdmin
      .from('draft_sessions')
      .select('*')
      .eq('id', session_id)
      .single()

    if (!session || sErr) throw new Error('Session not found')
    if (session.current_pick_franchise_id !== franchise_id) {
      throw new Error('Not your turn')
    }

    // 3. Verify player is available
    const { data: player, error: pErr } = await supabaseAdmin
      .from('players')
      .select('id')
      .eq('id', player_id)
      .is('franchise_id', null)
      .single()

    if (!player || pErr) throw new Error('Player not available')

    // 4. Determine current pick number
    const { count } = await supabaseAdmin
      .from('draft_picks')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', session_id)
    
    const pickNum = (count || 0) + 1

    // 5. Insert pick
    await supabaseAdmin
      .from('draft_picks')
      .insert({
        session_id,
        franchise_id,
        player_id,
        round: session.current_round,
        pick_number: pickNum
      })

    // 6. Assign player to franchise
    await supabaseAdmin
      .from('players')
      .update({ franchise_id })
      .eq('id', player_id)

    // 7. Calculate next turn (Snake Draft: 1->8, then 8->1)
    // For simplicity in this mock, we just find the next franchise in the league.
    // In a real snake draft, we'd order franchises by draft order and snake through them.
    const { data: leagueFranchises } = await supabaseAdmin
      .from('franchises')
      .select('id')
      .eq('league_id', franchise.league_id)
      .order('created_at', { ascending: true })

    if (leagueFranchises) {
      let nextIndex = 0
      const currentIndex = leagueFranchises.findIndex(f => f.id === franchise_id)
      
      const isEvenRound = session.current_round % 2 === 0
      
      if (!isEvenRound) {
        // 1 to 8
        if (currentIndex < leagueFranchises.length - 1) {
          nextIndex = currentIndex + 1
        } else {
          nextIndex = currentIndex // Turnaround
        }
      } else {
        // 8 to 1
        if (currentIndex > 0) {
          nextIndex = currentIndex - 1
        } else {
          nextIndex = currentIndex // Turnaround
        }
      }

      let nextRound = session.current_round
      // If we are at the end of the round
      if ((!isEvenRound && currentIndex === leagueFranchises.length - 1) || 
          (isEvenRound && currentIndex === 0)) {
        nextRound++
      }

      const nextFranchiseId = leagueFranchises[nextIndex].id

      if (nextRound > 8) {
        // Draft is over, clean up
        await supabaseAdmin
          .from('draft_sessions')
          .delete()
          .eq('id', session_id)
      } else {
        await supabaseAdmin
          .from('draft_sessions')
          .update({ current_pick_franchise_id: nextFranchiseId, current_round: nextRound })
          .eq('id', session_id)
      }
    }

    return new Response(JSON.stringify({ success: true }), {
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
