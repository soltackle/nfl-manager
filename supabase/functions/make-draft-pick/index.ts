import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"
import { generateTraits, calculatePlayerValue } from "../_shared/playerUtils.ts"

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
    let user = null
    
    // Check if it's the service role key
    if (token === Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')) {
      // Create a dummy admin user
      user = { id: 'admin', email: 'admin@system.local' }
    } else {
      const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token)
      if (userError || !userData?.user) throw new Error('Invalid token')
      user = userData.user
    }

    const { franchise_id, session_id, player_id, is_timeout } = await req.json()

    // 1. Verify franchise belongs to user (or is bot logic bypassing it)
    const { data: franchise, error: fErr } = await supabaseAdmin
      .from('franchises')
      .select('id, league_id, user_id')
      .eq('id', franchise_id)
      .single()

    if (!franchise || fErr) throw new Error('Franchise not found')

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

    // PRE-FETCH DATA ONCE TO AVOID TIMEOUTS
    const { data: leagueFranchises } = await supabaseAdmin
      .from('franchises')
      .select('id, user_id')
      .eq('league_id', franchise.league_id)
      .order('created_at', { ascending: true })

    if (!leagueFranchises) throw new Error('No franchises found')

    const { data: usersData } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .in('id', leagueFranchises.map(f => f.user_id))
    
    const userRoleMap = new Map(usersData?.map(u => [u.id, u.role]))

    let { data: available } = await supabaseAdmin
      .from('players')
      .select('id, position, overall')
      .eq('league_id', session.league_id)
      .is('franchise_id', null)
      .order('value', { ascending: false })

    if (!available) available = []

    // Fetch existing picks to determine pick number accurately
    const { count: pickCount } = await supabaseAdmin
      .from('draft_picks')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', session_id)
      
    let pickNum = (pickCount || 0) + 1

    // PRE-FETCH ROSTERS FOR BOTS TO AVOID QUERYING INSIDE LOOP
    const { data: allRosters } = await supabaseAdmin
      .from('players')
      .select('id, position, overall, franchise_id')
      .eq('league_id', session.league_id)
      .not('franchise_id', 'is', null)
      
    // Create a map of franchise_id -> players
    const rosterMap = new Map()
    leagueFranchises.forEach(f => rosterMap.set(f.id, []))
    if (allRosters) {
      allRosters.forEach(p => {
        if (rosterMap.has(p.franchise_id)) {
          rosterMap.get(p.franchise_id).push(p)
        }
      })
    }

    const picksToInsert = []
    const playersToUpdate = []

    while (true) {
      // 1. Verify franchise
      const franchiseObj = leagueFranchises.find(f => f.id === currentFranchiseId)
      if (!franchiseObj) throw new Error('Franchise not found')

      const ownerRole = userRoleMap.get(franchiseObj.user_id)

      if (isHumanRequest && franchiseObj.user_id !== user.id && ownerRole !== 'bot') {
        if (!is_timeout) {
          throw new Error('Unauthorized franchise')
        } else {
          isHumanRequest = false
          currentPlayerId = null
        }
      }

      // 2. Bot Algorithm
      if (!currentPlayerId) {
        if (available.length === 0) throw new Error('No players available')

        const roster = rosterMap.get(currentFranchiseId) || []
        const rosterCount: Record<string, number> = {}
        const maxOverall: Record<string, number> = {}
        const positions = ['QB', 'RB', 'WR', 'TE', 'OL', 'DE', 'LB', 'CB', 'S', 'K']
        
        positions.forEach(p => { rosterCount[p] = 0; maxOverall[p] = 0; })
        roster.forEach((p: any) => {
          rosterCount[p.position] = (rosterCount[p.position] || 0) + 1
          if (p.overall > maxOverall[p.position]) maxOverall[p.position] = p.overall
        })

        let needPos = null
        if (maxOverall['QB'] < 70 && rosterCount['QB'] < 1) needPos = 'QB'
        else if (maxOverall['OL'] < 65 && rosterCount['OL'] < 5) needPos = 'OL'
        else if (rosterCount['K'] === 0) needPos = 'K'

        if (needPos) {
          const bestNeedIndex = available.findIndex(p => p.position === needPos)
          if (bestNeedIndex !== -1) {
            currentPlayerId = available[bestNeedIndex].id
            available.splice(bestNeedIndex, 1)
          }
        }

        if (!currentPlayerId) {
          currentPlayerId = available[0].id
          available.splice(0, 1)
        }
      } else {
        const pickedIndex = available.findIndex(p => p.id === currentPlayerId)
        if (pickedIndex !== -1) available.splice(pickedIndex, 1)
      }

      // 4. Queue pick & assign
      picksToInsert.push({
        session_id,
        franchise_id: currentFranchiseId,
        player_id: currentPlayerId,
        round: currentRound,
        pick_number: pickNum
      })
      playersToUpdate.push({
        id: currentPlayerId,
        franchise_id: currentFranchiseId
      })
      
      // Update local roster map for subsequent bot picks
      const playerObj = { id: currentPlayerId, position: 'UNKNOWN', overall: 70 } // We just need it for count mostly, but available had pos/ovr!
      rosterMap.get(currentFranchiseId).push(playerObj)

      // Increment local pick number
      pickNum++

      // 5. Calculate next turn
      let nextIndex = 0
      const currentIndex = leagueFranchises.findIndex(f => f.id === currentFranchiseId)
      const isEvenRound = currentRound % 2 === 0
      
      if (!isEvenRound) {
        nextIndex = currentIndex < leagueFranchises.length - 1 ? currentIndex + 1 : currentIndex
      } else {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex
      }

      let nextRound = currentRound
      if ((!isEvenRound && currentIndex === leagueFranchises.length - 1) || (isEvenRound && currentIndex === 0)) {
        nextRound++
      }

      const nextFranchiseObj = leagueFranchises[nextIndex]

      if (nextRound > 8) {
        // Draft is over!
        
        // Execute batched picks before ending
        if (picksToInsert.length > 0) {
          await supabaseAdmin.from('draft_picks').insert(picksToInsert)
          for (const p of playersToUpdate) {
            await supabaseAdmin.from('players').update({ franchise_id: p.franchise_id }).eq('id', p.id)
          }
        }

        await supabaseAdmin.from('draft_sessions').delete().eq('id', session_id)
        
        const rolePositions = [
          'QB', 'RB', 'WR', 'WR', 'WR', 'TE', 'OL', 'OL', 'OL',
          'DE', 'DE', 'LB', 'LB', 'LB', 'CB', 'CB', 'S', 'S',
          'K', 'P', 'RB', 'TE'
        ]
        const allRolePlayers = []
        for (const lf of leagueFranchises) {
          for (let i = 0; i < rolePositions.length; i++) {
            const pos = rolePositions[i]
            const names = ['Role', 'Backup', 'Reserve', 'Bench', 'Squad', 'Practice', 'Depth', 'Sub', 'Rookie', 'Veteran', 'Free Agent', 'Prospect', 'Walk-on', 'Camp', 'Local', 'Undrafted', 'Trial', 'Invite', 'Guest', 'Temp', 'Rotational', 'Development']
            const overall = 45 + Math.floor(Math.random() * 15)
            const baseValue = 10000 + Math.floor(Math.random() * 40000)
            const traits = generateTraits(overall, pos)
            const finalValue = calculatePlayerValue(baseValue, traits.length)
            
            allRolePlayers.push({
              franchise_id: lf.id,
              name: `${names[i % names.length]} ${pos}${Math.floor(Math.random() * 99)}`,
              position: pos,
              overall: overall,
              value: finalValue,
              traits: traits
            })
          }
        }
        await supabaseAdmin.from('players').insert(allRolePlayers)

        await supabaseAdmin.rpc('generate_fixtures', { p_league_id: franchise.league_id })
        await supabaseAdmin.from('leagues').update({ status: 'active' }).eq('id', franchise.league_id)
        break
      } else {
        const nextOwnerRole = userRoleMap.get(nextFranchiseObj.user_id)
        if (nextOwnerRole === 'bot') {
          currentFranchiseId = nextFranchiseObj.id
          currentPlayerId = null
          currentRound = nextRound
          isHumanRequest = false
          continue
        } else {
          // Execute batched picks and update session
          if (picksToInsert.length > 0) {
            await supabaseAdmin.from('draft_picks').insert(picksToInsert)
            // Parallelize player updates
            await Promise.all(playersToUpdate.map(p => 
              supabaseAdmin.from('players').update({ franchise_id: p.franchise_id }).eq('id', p.id)
            ))
          }
          await supabaseAdmin.from('draft_sessions').update({ 
            current_pick_franchise_id: nextFranchiseObj.id, 
            current_round: nextRound 
          }).eq('id', session_id)
          break
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    try {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )
      await supabaseAdmin.from('players').insert({
        name: 'ERROR: ' + error.message,
        position: 'QB',
        overall: 99,
        value: 1000,
        traits: []
      })
    } catch (e) {}

    return new Response(JSON.stringify({ error: error.message, stack: error.stack }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
