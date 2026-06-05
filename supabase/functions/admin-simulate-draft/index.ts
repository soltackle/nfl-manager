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
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''))
    if (userError || !user) throw new Error('Invalid token')

    // Verify admin
    const { data: dbUser } = await supabaseAdmin.from('users').select('role').eq('id', user.id).single()
    if (!dbUser || dbUser.role !== 'admin') throw new Error('Unauthorized')

    const { league_id } = await req.json()
    if (!league_id) throw new Error('league_id required')

    // 1. Get franchises in league
    const { data: franchises } = await supabaseAdmin.from('franchises').select('id').eq('league_id', league_id)
    if (!franchises || franchises.length < 2) {
      throw new Error('Ligde en az 2 takım olmalı. Önce botlarla doldurun.')
    }

    // 2. Set league status to 'draft' first
    await supabaseAdmin.from('leagues').update({ status: 'draft' }).eq('id', league_id)

    // 3. Create a draft session
    const { data: draftSession, error: dsErr } = await supabaseAdmin.from('draft_sessions').insert({
      league_id,
      current_round: 1,
      current_pick_franchise_id: franchises[0].id
    }).select().single()
    if (dsErr) {
      // Session might already exist, try to fetch it
      const { data: existingSession } = await supabaseAdmin.from('draft_sessions').select('*').eq('league_id', league_id).single()
      if (!existingSession) throw new Error("Draft session oluşturulamadı: " + dsErr.message)
    }

    // 4. Generate random players for each franchise to simulate draft
    // Use only valid enum positions: QB, RB, WR, TE, OL, DE, LB, CB, S, K, P
    const positions: string[] = [
      'QB', 'RB', 'WR', 'WR', 'WR', 'TE', 'OL', 'OL', 'OL',
      'DE', 'DE', 'LB', 'LB', 'LB', 'CB', 'CB', 'S', 'S',
      'K', 'P', 'RB', 'TE'
    ]

    for (const franchise of franchises) {
      // First, check if franchise already has players (avoid duplicates on re-run)
      const { data: existingPlayers } = await supabaseAdmin.from('players').select('id').eq('franchise_id', franchise.id).limit(1)
      if (existingPlayers && existingPlayers.length > 0) continue

      const playersToInsert = []
      
      // 1. Generate 8 "Drafted" Star Players (Overall 65-90)
      const starPositions = ['QB', 'RB', 'WR', 'TE', 'DE', 'LB', 'CB', 'S']
      for (let i = 0; i < 8; i++) {
        const pos = starPositions[i % starPositions.length]
        const names = ['James', 'Williams', 'Johnson', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson']
        const overall = 65 + Math.floor(Math.random() * 25)
        const baseValue = 100000 + Math.floor(Math.random() * 900000)
        const traits = generateTraits(overall, pos)
        
        playersToInsert.push({
          franchise_id: franchise.id,
          name: `${names[Math.floor(Math.random() * names.length)]} ${pos}${Math.floor(Math.random() * 99)}`,
          position: pos,
          overall: overall,
          value: calculatePlayerValue(baseValue, traits.length),
          traits: traits
        })
      }

      // 2. Generate 22 Role Players (Overall 45-60) to fill Depth Chart perfectly
      const roleNames = ['Role', 'Backup', 'Reserve', 'Bench', 'Squad', 'Practice', 'Depth', 'Sub', 'Rookie', 'Veteran', 'Free Agent', 'Prospect', 'Walk-on', 'Camp']
      for (let i = 0; i < positions.length; i++) {
        const pos = positions[i]
        const overall = 45 + Math.floor(Math.random() * 15)
        const baseValue = 10000 + Math.floor(Math.random() * 40000)
        const traits = generateTraits(overall, pos)
        
        playersToInsert.push({
          franchise_id: franchise.id,
          name: `${roleNames[i % roleNames.length]} ${pos}${Math.floor(Math.random() * 99)}`,
          position: pos,
          overall: overall,
          value: calculatePlayerValue(baseValue, traits.length),
          traits: traits
        })
      }

      const { error: pErr } = await supabaseAdmin.from('players').insert(playersToInsert)
      if (pErr) throw new Error("Player insert error: " + pErr.message)
    }

    // 5. Generate fixtures for the season
    const { error: fixErr } = await supabaseAdmin.rpc('generate_fixtures', { p_league_id: league_id })
    if (fixErr) console.error("Fixture generation error:", fixErr)

    // 6. Set league to active to start the season!
    await supabaseAdmin.from('leagues').update({ status: 'active' }).eq('id', league_id)

    return new Response(JSON.stringify({ success: true, message: 'Draft simüle edildi, fikstür oluşturuldu ve sezon başladı!' }), {
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
