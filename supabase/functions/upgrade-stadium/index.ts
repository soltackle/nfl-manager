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

    const { franchise_id, upgrade_type } = await req.json()

    // Validate ownership and get franchise funds
    const { data: franchise, error: fErr } = await supabaseAdmin
      .from('franchises')
      .select('id, club_fund')
      .eq('id', franchise_id)
      .eq('user_id', user.id)
      .single()
      
    if (!franchise || fErr) throw new Error('Unauthorized franchise')

    // Get current stadium
    const { data: stadium, } = await supabaseAdmin
      .from('stadiums')
      .select('*')
      .eq('franchise_id', franchise_id)
      .single()

    // If stadium doesn't exist (because trigger didn't run for old franchises), create it
    let currentStadium = stadium
    if (!stadium) {
      const { data: newStadium } = await supabaseAdmin
        .from('stadiums')
        .insert({ franchise_id })
        .select()
        .single()
      currentStadium = newStadium
    }

    if (!currentStadium) throw new Error('Stadium not found')

    // Determine cost and next level
    let currentLevel = 0
    if (upgrade_type === 'turf') currentLevel = currentStadium.turf_level
    else if (upgrade_type === 'capacity') currentLevel = currentStadium.capacity_level
    else if (upgrade_type === 'practice') currentLevel = currentStadium.practice_facility_level
    else throw new Error('Invalid upgrade type')

    if (currentLevel >= 3) throw new Error('Already at max level')

    const costArray = [1000000, 2500000, 4000000] // Lvl 1, 2, 3 costs
    const cost = costArray[currentLevel]

    if (franchise.club_fund < cost) throw new Error('Yetersiz Kulüp Fonu (Insufficient Funds)')

    // Apply upgrade
    const newFund = franchise.club_fund - cost
    const newLevel = currentLevel + 1

    await supabaseAdmin
      .from('franchises')
      .update({ club_fund: newFund })
      .eq('id', franchise_id)

    const updateData: unknown = {}
    if (upgrade_type === 'turf') updateData.turf_level = newLevel
    if (upgrade_type === 'capacity') updateData.capacity_level = newLevel
    if (upgrade_type === 'practice') updateData.practice_facility_level = newLevel

    await supabaseAdmin
      .from('stadiums')
      .update(updateData)
      .eq('id', currentStadium.id)

    return new Response(JSON.stringify({ success: true, message: 'Yükseltme başarılı!', new_fund: newFund, new_level: newLevel }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: unknown) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
