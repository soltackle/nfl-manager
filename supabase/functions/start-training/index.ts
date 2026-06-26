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

    const { franchise_id, player_ids, slot } = await req.json()

    // Validate ownership
    const { data: franchise } = await supabaseAdmin
      .from('franchises')
      .select('id')
      .eq('id', franchise_id)
      .eq('user_id', user.id)
      .single()
      
    if (!franchise) throw new Error('Unauthorized franchise')

    // Create 4-hour sessions for each player
    const completedAt = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
    
    const sessions = player_ids.map((pid: string) => ({
      franchise_id,
      player_id: pid,
      completed_at: completedAt
    }))

    const { error: insertErr } = await supabaseAdmin
      .from('training_sessions')
      .insert(sessions)

    if (insertErr) throw insertErr

    return new Response(JSON.stringify({ success: true, message: 'Antrenman başladı.' }), {
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
