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

    // 1. Verify franchise belongs to user (or is bot logic bypassing it)
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

    // 3. Bot Algorithm: If player_id is null, find the best pick
    let selectedPlayerId = player_id
    if (!selectedPlayerId) {
      // Fetch current roster
      const { data: roster } = await supabaseAdmin
        .from('players')
        .select('position, overall')
        .eq('franchise_id', franchise_id)

      // Fetch available players
      const { data: available } = await supabaseAdmin
        .from('players')
        .select('id, position, overall')
        .is('franchise_id', null)
        .order('overall', { ascending: false })

      if (!available || available.length === 0) throw new Error('No players available')

      const positions = ['QB', 'RB', 'WR', 'TE', 'OL', 'DE', 'LB', 'CB', 'S', 'K']
      const rosterCount: Record<string, number> = {}
      const maxOverall: Record<string, number> = {}
      
      positions.forEach(p => {
        rosterCount[p] = 0
        maxOverall[p] = 0
      })

      if (roster) {
        roster.forEach(p => {
          rosterCount[p.position] = (rosterCount[p.position] || 0) + 1
          if (p.overall > maxOverall[p.position]) maxOverall[p.position] = p.overall
        })
      }

      // Check for critical weakness
      let needPos = null
      if (maxOverall['QB'] < 70 && rosterCount['QB'] < 1) needPos = 'QB'
      else if (maxOverall['OL'] < 65 && rosterCount['OL'] < 5) needPos = 'OL'
      else if (rosterCount['K'] === 0) needPos = 'K'

      if (needPos) {
        const bestNeed = available.find(p => p.position === needPos)
        if (bestNeed) {
          selectedPlayerId = bestNeed.id
        }
      }

      // If no critical need or none found, just pick best overall available
      if (!selectedPlayerId) {
        selectedPlayerId = available[0].id
      }
    }

    if (!selectedPlayerId) throw new Error('Could not determine a player to pick')

    // Verify player is available
    const { data: player, error: pErr } = await supabaseAdmin
      .from('players')
      .select('id')
      .eq('id', selectedPlayerId)
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
        player_id: selectedPlayerId,
        round: session.current_round,
        pick_number: pickNum
      })

    // 6. Assign player to franchise
    await supabaseAdmin
      .from('players')
      .update({ franchise_id })
      .eq('id', selectedPlayerId)

    // 7. Calculate next turn (Snake Draft)
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
        if (currentIndex < leagueFranchises.length - 1) {
          nextIndex = currentIndex + 1
        } else {
          nextIndex = currentIndex // Turnaround
        }
      } else {
        if (currentIndex > 0) {
          nextIndex = currentIndex - 1
        } else {
          nextIndex = currentIndex // Turnaround
        }
      }

      let nextRound = session.current_round
      if ((!isEvenRound && currentIndex === leagueFranchises.length - 1) || 
          (isEvenRound && currentIndex === 0)) {
        nextRound++
      }

      const nextFranchiseId = leagueFranchises[nextIndex].id

      if (nextRound > 8) {
        // Draft is over!
        // 1. Delete draft session
        await supabaseAdmin
          .from('draft_sessions')
          .delete()
          .eq('id', session_id)
        
        // 2. Generate 14 Role Players for each franchise to reach 22 players total
        const rolePositions: string[] = ['QB', 'RB', 'WR', 'TE', 'OL', 'DE', 'LB', 'CB', 'S', 'K', 'OL', 'DE', 'LB', 'CB']
        for (const lf of leagueFranchises) {
          const playersToInsert = []
          for (let i = 0; i < 14; i++) {
            const pos = rolePositions[i % rolePositions.length]
            const names = ['Role', 'Backup', 'Reserve', 'Bench', 'Squad', 'Practice', 'Depth', 'Sub', 'Rookie', 'Veteran', 'Free Agent', 'Prospect', 'Walk-on', 'Camp']
            playersToInsert.push({
              franchise_id: lf.id,
              name: `${names[i]} ${pos}${Math.floor(Math.random() * 99)}`,
              position: pos,
              overall: 45 + Math.floor(Math.random() * 15), // 45-60 OVR (Role Player)
              value: 10000 + Math.floor(Math.random() * 40000)
            })
          }
          await supabaseAdmin.from('players').insert(playersToInsert)
        }

        // 3. Generate fixtures for the season
        await supabaseAdmin.rpc('generate_fixtures', { p_league_id: franchise.league_id })

        // 4. Set league to active
        await supabaseAdmin.from('leagues').update({ status: 'active' }).eq('id', franchise.league_id)
      } else {
        // Continue to next pick
        await supabaseAdmin
          .from('draft_sessions')
          .update({ current_pick_franchise_id: nextFranchiseId, current_round: nextRound })
          .eq('id', session_id)
      }
    }

    return new Response(JSON.stringify({ success: true, picked_player_id: selectedPlayerId }), {
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
