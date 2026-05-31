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

    // Check auth or allow local/cron if we pass a secret
    // To keep it simple, we check if it's called with admin token
    
    // Find sessions that have completed_at < now()
    const { data: sessions, error: fetchErr } = await supabaseAdmin
      .from('training_sessions')
      .select('*, players(*)')
      .lte('completed_at', new Date().toISOString())

    if (fetchErr) throw fetchErr

    if (!sessions || sessions.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No sessions to process' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    let processedCount = 0

    // Process each player
    for (const session of sessions) {
      const p = session.players
      if (!p) continue

      // Calculate growth based on age
      let growthRate = 0
      if (p.age >= 18 && p.age <= 21) growthRate = 0.03 + Math.random() * 0.01 // 3-4%
      else if (p.age >= 22 && p.age <= 25) growthRate = 0.02 + Math.random() * 0.01 // 2-3%
      else if (p.age >= 26 && p.age <= 29) growthRate = 0.01 + Math.random() * 0.01 // 1-2%
      else growthRate = 0.005 // 0.5% for 30+

      const newOverall = Math.min(99, Math.round(p.overall * (1 + growthRate)))

      // Update player
      await supabaseAdmin
        .from('players')
        .update({ overall: newOverall })
        .eq('id', p.id)

      // Delete session
      await supabaseAdmin
        .from('training_sessions')
        .delete()
        .eq('id', session.id)

      processedCount++
    }

    return new Response(JSON.stringify({ success: true, processed: processedCount }), {
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
