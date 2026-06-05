import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"
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
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''))
    if (userError || !user) throw new Error('Invalid token')

    const { league_id } = await req.json()
    if (!league_id) throw new Error('league_id required')

    // Verify league ownership
    const { data: league, error: lErr } = await supabaseAdmin
      .from('leagues')
      .select('id, owner_user_id, status')
      .eq('id', league_id)
      .single()

    if (lErr || !league) throw new Error('League not found')
    if (league.owner_user_id !== user.id) throw new Error('Only the commissioner can start the draft')
    if (league.status !== 'waiting') throw new Error('League is no longer waiting for players')

    // Ensure there are exactly 8 franchises
    const { data: franchises } = await supabaseAdmin
      .from('franchises')
      .select('id, user_id')
      .eq('league_id', league_id)
      .order('created_at', { ascending: true })
      
    if (!franchises || franchises.length < 8) {
      throw new Error('League is not full yet. Fill empty slots with bots first.')
    }

    // Check if Draft Pool exists
    const { data: existingPool } = await supabaseAdmin
      .from('players')
      .select('id')
      .is('franchise_id', null)
      .limit(1)

    // Generate Draft Pool (Free Agents) if none exist
    if (!existingPool || existingPool.length === 0) {
      const draftPlayers = []
      // We want to guarantee Star QBs and enough players for everyone
      const poolRequirements = [
        { pos: 'QB', count: 12, starChance: 0.3 }, // High chance for star QBs
        { pos: 'RB', count: 16, starChance: 0.2 },
        { pos: 'WR', count: 20, starChance: 0.2 },
        { pos: 'TE', count: 12, starChance: 0.2 },
        { pos: 'OL', count: 24, starChance: 0.1 },
        { pos: 'DE', count: 16, starChance: 0.2 },
        { pos: 'LB', count: 16, starChance: 0.2 },
        { pos: 'CB', count: 16, starChance: 0.2 },
        { pos: 'S', count: 12, starChance: 0.2 },
        { pos: 'K', count: 8, starChance: 0.1 }
      ]

      for (const req of poolRequirements) {
        for (let i = 0; i < req.count; i++) {
          const isStar = Math.random() < req.starChance
          // Stars: 85-95 OVR, Normals: 72-84 OVR
          const overall = isStar 
            ? Math.floor(Math.random() * 11) + 85 
            : Math.floor(Math.random() * 13) + 72
            
          const baseValue = overall * 150000
          const traits = generateTraits(overall, req.pos)
          const finalValue = calculatePlayerValue(baseValue, traits.length)
          
          let prefix = isStar ? 'Star' : 'Pro'
          if (overall >= 90) prefix = 'Elite'

          draftPlayers.push({
            franchise_id: null, // Draft Pool
            name: `${prefix} ${req.pos} ${Math.floor(Math.random() * 1000)}`,
            position: req.pos,
            overall: overall,
            value: finalValue,
            traits: traits
          })
        }
      }

      await supabaseAdmin.from('players').insert(draftPlayers)
    }

    // Set league status to draft
    await supabaseAdmin.from('leagues').update({ status: 'draft' }).eq('id', league_id)

    // Create draft session
    const firstFranchise = franchises[0]
    const { data: session, error: sessionErr } = await supabaseAdmin
      .from('draft_sessions')
      .insert({
        league_id: league_id,
        current_round: 1,
        current_pick_franchise_id: firstFranchise.id
      })
      .select()
      .single()

    if (sessionErr) throw sessionErr

    // If first franchise is a bot, trigger make-draft-pick
    const { data: firstUser } = await supabaseAdmin.from('users').select('role').eq('id', firstFranchise.user_id).single()
    if (firstUser?.role === 'bot') {
      // Invoke make-draft-pick
      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/make-draft-pick`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          franchise_id: firstFranchise.id,
          session_id: session.id,
          player_id: null,
          is_timeout: true
        })
      }).catch(e => console.error("Error triggering first bot pick:", e))
    }

    return new Response(JSON.stringify({ success: true, session }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400
    })
  }
})
