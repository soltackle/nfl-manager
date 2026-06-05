import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

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

    const { league_id, minutes } = await req.json()
    if (!league_id || minutes === undefined) throw new Error('league_id and minutes required')

    // Verify league ownership
    const { data: league, error: lErr } = await supabaseAdmin
      .from('leagues')
      .select('id, owner_user_id, status')
      .eq('id', league_id)
      .single()

    if (lErr || !league) throw new Error('League not found')
    if (league.owner_user_id !== user.id) throw new Error('Only the commissioner can set draft time')
    if (league.status !== 'waiting') throw new Error('League is no longer waiting for players')

    const targetTime = new Date(Date.now() + minutes * 60000)

    const { data, error } = await supabaseAdmin
      .from('leagues')
      .update({ draft_start_time: targetTime.toISOString() })
      .eq('id', league_id)
      .select()
      .single()
      
    if (error) throw error

    return new Response(JSON.stringify({ success: true, draft_start_time: targetTime.toISOString() }), {
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
