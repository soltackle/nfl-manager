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

    // Verify admin
    const { data: dbUser } = await supabaseAdmin.from('users').select('role').eq('id', user.id).single()
    if (!dbUser || dbUser.role !== 'admin') throw new Error('Unauthorized')

    const { league_id } = await req.json()
    if (!league_id) throw new Error('league_id required')

    // 1. Get franchises in league
    const { data: franchises } = await supabaseAdmin.from('franchises').select('id').eq('league_id', league_id)
    if (!franchises || franchises.length !== 8) {
      throw new Error('Ligde tam 8 takım olmalı. Önce botlarla doldurun.')
    }

    // 2. Generate random players for each franchise to simulate draft
    // In a real app we'd pull from draft_picks and create them based on the snake draft logic,
    // but for "hızlı geç" we will just generate 22 players per team (11 offense, 11 defense).
    const positions = ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'DB']
    
    for (const franchise of franchises) {
      const playersToInsert = []
      // Generate 22 starters
      for (let i = 0; i < 22; i++) {
        const pos = positions[i % positions.length]
        playersToInsert.push({
          franchise_id: franchise.id,
          first_name: 'Drafted',
          last_name: `Player_${i}`,
          position: pos,
          age: 20 + Math.floor(Math.random() * 10),
          overall: 60 + Math.floor(Math.random() * 30),
          potential: 70 + Math.floor(Math.random() * 25),
          status: 'roster'
        })
      }
      
      const { error: pErr } = await supabaseAdmin.from('players').insert(playersToInsert)
      if (pErr) console.error("Player insert error", pErr)
    }

    // 3. Set league to active to start the season!
    await supabaseAdmin.from('leagues').update({ status: 'active' }).eq('id', league_id)

    return new Response(JSON.stringify({ success: true, message: 'Draft tamamlandı, lig başladı!' }), {
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
