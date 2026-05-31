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

    // Main draft pick loop. Loops if the next franchise is a bot.
    let currentFranchiseId = franchise_id
    let currentPlayerId = player_id
    let currentRound = session.current_round
    let isHumanRequest = true

    while (true) {
      // 1. Verify franchise
      const { data: franchiseObj, error: fErr } = await supabaseAdmin
        .from('franchises')
        .select('id, league_id, user_id')
        .eq('id', currentFranchiseId)
        .single()
      if (!franchiseObj || fErr) throw new Error('Franchise not found')

      const { data: ownerObj } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', franchiseObj.user_id)
        .single()

      if (isHumanRequest && franchiseObj.user_id !== user.id && ownerObj?.role !== 'bot') {
        throw new Error('Unauthorized franchise')
      }

      // 2. Bot Algorithm: If currentPlayerId is null, find the best pick
      if (!currentPlayerId) {
        const { data: roster } = await supabaseAdmin
          .from('players')
          .select('position, overall')
          .eq('franchise_id', currentFranchiseId)

        const { data: available } = await supabaseAdmin
          .from('players')
          .select('id, position, overall')
          .is('franchise_id', null)
          .order('overall', { ascending: false })

        if (!available || available.length === 0) throw new Error('No players available')

        const positions = ['QB', 'RB', 'WR', 'TE', 'OL', 'DE', 'LB', 'CB', 'S', 'K']
        const rosterCount: Record<string, number> = {}
        const maxOverall: Record<string, number> = {}
        
        positions.forEach(p => { rosterCount[p] = 0; maxOverall[p] = 0; })
        if (roster) {
          roster.forEach(p => {
            rosterCount[p.position] = (rosterCount[p.position] || 0) + 1
            if (p.overall > maxOverall[p.position]) maxOverall[p.position] = p.overall
          })
        }

        let needPos = null
        if (maxOverall['QB'] < 70 && rosterCount['QB'] < 1) needPos = 'QB'
        else if (maxOverall['OL'] < 65 && rosterCount['OL'] < 5) needPos = 'OL'
        else if (rosterCount['K'] === 0) needPos = 'K'

        if (needPos) {
          const bestNeed = available.find(p => p.position === needPos)
          if (bestNeed) currentPlayerId = bestNeed.id
        }

        if (!currentPlayerId) {
          currentPlayerId = available[0].id
        }
      }

      // Verify player is available
      const { data: player } = await supabaseAdmin
        .from('players')
        .select('id')
        .eq('id', currentPlayerId)
        .is('franchise_id', null)
        .single()

      if (!player) throw new Error('Player not available: ' + currentPlayerId)

      // 3. Determine current pick number
      const { count } = await supabaseAdmin
        .from('draft_picks')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', session_id)
      
      const pickNum = (count || 0) + 1

      // 4. Insert pick & assign
      await supabaseAdmin.from('draft_picks').insert({
        session_id,
        franchise_id: currentFranchiseId,
        player_id: currentPlayerId,
        round: currentRound,
        pick_number: pickNum
      })
      await supabaseAdmin.from('players').update({ franchise_id: currentFranchiseId }).eq('id', currentPlayerId)

      // 5. Calculate next turn
      const { data: leagueFranchises } = await supabaseAdmin
        .from('franchises')
        .select('id, user_id')
        .eq('league_id', franchiseObj.league_id)
        .order('created_at', { ascending: true })

      let nextIndex = 0
      const currentIndex = leagueFranchises!.findIndex(f => f.id === currentFranchiseId)
      const isEvenRound = currentRound % 2 === 0
      
      if (!isEvenRound) {
        nextIndex = currentIndex < leagueFranchises!.length - 1 ? currentIndex + 1 : currentIndex
      } else {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex
      }

      let nextRound = currentRound
      if ((!isEvenRound && currentIndex === leagueFranchises!.length - 1) || (isEvenRound && currentIndex === 0)) {
        nextRound++
      }

      const nextFranchiseObj = leagueFranchises![nextIndex]

      if (nextRound > 8) {
        // Draft is over!
        await supabaseAdmin.from('draft_sessions').delete().eq('id', session_id)
        
        // Generate Role Players
        const rolePositions = ['QB', 'RB', 'WR', 'TE', 'OL', 'DE', 'LB', 'CB', 'S', 'K', 'OL', 'DE', 'LB', 'CB']
        for (const lf of leagueFranchises!) {
          const playersToInsert = []
          for (let i = 0; i < 14; i++) {
            const pos = rolePositions[i % rolePositions.length]
            const names = ['Role', 'Backup', 'Reserve', 'Bench', 'Squad', 'Practice', 'Depth', 'Sub', 'Rookie', 'Veteran', 'Free Agent', 'Prospect', 'Walk-on', 'Camp']
            playersToInsert.push({
              franchise_id: lf.id,
              name: `${names[i]} ${pos}${Math.floor(Math.random() * 99)}`,
              position: pos,
              overall: 45 + Math.floor(Math.random() * 15),
              value: 10000 + Math.floor(Math.random() * 40000)
            })
          }
          await supabaseAdmin.from('players').insert(playersToInsert)
        }

        // Generate fixtures and activate
        await supabaseAdmin.rpc('generate_fixtures', { p_league_id: franchiseObj.league_id })
        await supabaseAdmin.from('leagues').update({ status: 'active' }).eq('id', franchiseObj.league_id)
        break // exit loop

      } else {
        // Update session to next pick
        await supabaseAdmin.from('draft_sessions').update({ 
          current_pick_franchise_id: nextFranchiseObj.id, 
          current_round: nextRound 
        }).eq('id', session_id)

        // Check if next franchise is a bot
        const { data: nextOwner } = await supabaseAdmin.from('users').select('role').eq('id', nextFranchiseObj.user_id).single()
        if (nextOwner?.role === 'bot') {
          // Loop and pick for bot automatically!
          currentFranchiseId = nextFranchiseObj.id
          currentPlayerId = null // trigger auto-pick
          currentRound = nextRound
          isHumanRequest = false // skip auth check for bot
          continue
        } else {
          break // Wait for human
        }
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
