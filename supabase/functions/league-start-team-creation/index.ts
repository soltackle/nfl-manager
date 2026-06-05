import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { generateTraits, calculatePlayerValue, calculateBaseValue } from "../_shared/playerUtils.ts"

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

    const { league_id } = await req.json()
    if (!league_id) throw new Error('league_id is required')

    // 1. Get league and franchises
    const { data: league, error: lErr } = await supabaseAdmin.from('leagues').select('*').eq('id', league_id).single()
    if (lErr || !league) throw new Error('League not found')
    
    if (league.status !== 'waiting') {
      throw new Error('League is not in waiting state')
    }

    const { data: franchises } = await supabaseAdmin.from('franchises').select('*').eq('league_id', league_id)
    if (!franchises || franchises.length < 8) {
      throw new Error('League must be full (8 franchises) to start team creation')
    }

    // Determine roles (human vs bot)
    const userIds = franchises.map(f => f.user_id)
    const { data: profiles } = await supabaseAdmin.from('users').select('id, role').in('id', userIds)
    const roleMap = new Map()
    profiles?.forEach(p => roleMap.set(p.id, p.role))

    const playersToInsert = []

    for (const franchise of franchises) {
      const isBot = roleMap.get(franchise.user_id) === 'bot'
      
      // Bot behavior: Generate exact 11 starters and assign directly
      if (isBot) {
        const rosterReq = [
          { pos: 'QB', count: 2, starChance: 0.3 },
          { pos: 'RB', count: 2, starChance: 0.2 },
          { pos: 'WR', count: 4, starChance: 0.2 },
          { pos: 'TE', count: 2, starChance: 0.2 },
          { pos: 'OL', count: 2, starChance: 0.1 },
          { pos: 'DE', count: 2, starChance: 0.2 },
          { pos: 'LB', count: 2, starChance: 0.2 },
          { pos: 'CB', count: 2, starChance: 0.2 },
          { pos: 'S',  count: 2, starChance: 0.2 },
          { pos: 'K',  count: 2, starChance: 0.1 }
        ]
        
        let totalCost = 0

        for (const req of rosterReq) {
          for (let i = 0; i < req.count; i++) {
            const isStar = Math.random() < req.starChance
            const overall = isStar ? Math.floor(Math.random() * 11) + 85 : Math.floor(Math.random() * 13) + 72
            const baseValue = calculateBaseValue(overall)
            const traits = generateTraits(overall, req.pos)
            const finalValue = calculatePlayerValue(baseValue, traits.length)
            
            let prefix = isStar ? 'Star' : 'Pro'
            if (overall >= 90) prefix = 'Elite'

            totalCost += finalValue

            playersToInsert.push({
              league_id: league_id,
              franchise_id: franchise.id, // Direct to roster
              status: 'roster',
              name: `${prefix} ${req.pos} ${Math.floor(Math.random() * 1000)}`,
              position: req.pos,
              overall: overall,
              value: finalValue,
              traits: traits
            })
          }
        }
        
        // Deduct cost from bot budget and set bot as ready
        await supabaseAdmin.from('franchises').update({ budget: 100000000 - totalCost, is_ready: true }).eq('id', franchise.id)
      } 
      // Human behavior: Generate 40-50 players into their personal pool
      else {
        const poolReq = [
          { pos: 'QB', count: 4, starChance: 0.3 },
          { pos: 'RB', count: 4, starChance: 0.2 },
          { pos: 'WR', count: 6, starChance: 0.2 },
          { pos: 'TE', count: 4, starChance: 0.2 },
          { pos: 'OL', count: 5, starChance: 0.1 },
          { pos: 'DE', count: 5, starChance: 0.2 },
          { pos: 'LB', count: 4, starChance: 0.2 },
          { pos: 'CB', count: 4, starChance: 0.2 },
          { pos: 'S',  count: 4, starChance: 0.2 },
          { pos: 'K',  count: 3, starChance: 0.1 }
        ]
        
        for (const req of poolReq) {
          for (let i = 0; i < req.count; i++) {
            const isStar = Math.random() < req.starChance
            const overall = isStar ? Math.floor(Math.random() * 11) + 85 : Math.floor(Math.random() * 13) + 72
            const baseValue = calculateBaseValue(overall)
            const traits = generateTraits(overall, req.pos)
            const finalValue = calculatePlayerValue(baseValue, traits.length)
            
            let prefix = isStar ? 'Star' : 'Pro'
            if (overall >= 90) prefix = 'Elite'

            playersToInsert.push({
              league_id: league_id,
              franchise_id: null,
              target_user_id: franchise.user_id, // Assigned to this specific user's personal pool
              status: 'personal_pool',
              name: `${prefix} ${req.pos} ${Math.floor(Math.random() * 1000)}`,
              position: req.pos,
              overall: overall,
              value: finalValue,
              traits: traits
            })
          }
        }
      }
    }

    if (playersToInsert.length > 0) {
      const { error: insertError } = await supabaseAdmin.from('players').insert(playersToInsert)
      if (insertError) throw new Error('Player insert failed: ' + insertError.message)
    }

    // Update league status to draft
    const { error: updateError } = await supabaseAdmin.from('leagues').update({ status: 'draft' }).eq('id', league_id)
    if (updateError) throw new Error('League update failed: ' + updateError.message)

    // Check if ALL human managers are actually done (if there are NO human managers!)
    const humanFranchises = franchises.filter(f => roleMap.get(f.user_id) !== 'bot')
    if (humanFranchises.length === 0) {
      // If it's a full bot league (unlikely but possible), start it immediately
      await supabaseAdmin.from('leagues').update({ status: 'active' }).eq('id', league_id)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})
