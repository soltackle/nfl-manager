import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"
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

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Auth Header')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''))
    if (userError || !user) throw new Error('Invalid token')

    const { franchise_id, position } = await req.json()
    if (!franchise_id || !position) throw new Error('Missing parameters')

    // Verify franchise
    const { data: franchise, error: fErr } = await supabaseAdmin
      .from('franchises')
      .select('id, user_id')
      .eq('id', franchise_id)
      .eq('user_id', user.id)
      .single()

    if (!franchise || fErr) throw new Error('Unauthorized franchise')

    // Check if user has enough coins
    const { data: userData, error: uErr } = await supabaseAdmin
      .from('users')
      .select('amfutcoin')
      .eq('id', user.id)
      .single()

    if (uErr || !userData) throw new Error('User not found')
    if (userData.amfutcoin < 100) throw new Error('Yetersiz Amfutcoin (100 Coin gereklidir).')

    // Check daily limit (only 1 mission per day per franchise)
    const today = new Date().toISOString().split('T')[0]
    const { data: existingMissions } = await supabaseAdmin
      .from('scout_missions')
      .select('id')
      .eq('franchise_id', franchise_id)
      .eq('created_date', today)

    if (existingMissions && existingMissions.length > 0) {
      throw new Error('Günde sadece 1 kez scout gönderebilirsiniz. Lütfen yarın tekrar gelin.')
    }

    // Generate Player Data (OVR 80-95)
    const names = ['James', 'Williams', 'Johnson', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Rodriguez', 'Lewis']
    const overall = 80 + Math.floor(Math.random() * 16) // 80 to 95
    const baseValue = calculateBaseValue(overall)
    const traits = generateTraits(overall, position)
    
    const playerData = {
      name: `${names[Math.floor(Math.random() * names.length)]} ${position}${Math.floor(Math.random() * 99)} (Scout)`,
      position: position,
      overall: overall,
      value: calculatePlayerValue(baseValue, traits.length),
      traits: traits
    }

    // Insert into scout_missions (10 minute wait time)
    const end_time = new Date(Date.now() + 10 * 60000).toISOString()
    const { data: mission, error: mErr } = await supabaseAdmin
      .from('scout_missions')
      .insert({
        franchise_id,
        user_id: user.id,
        position,
        status: 'searching',
        end_time,
        player_data: playerData
      })
      .select()
      .single()

    if (mErr) throw new Error("Görev oluşturulamadı: " + mErr.message)

    // Deduct coins
    await supabaseAdmin
      .from('users')
      .update({ amfutcoin: userData.amfutcoin - 100 })
      .eq('id', user.id)

    return new Response(JSON.stringify({ success: true, mission }), {
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
