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
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error("Missing Authorization header")
    const token = authHeader.replace('Bearer ', '')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
    if (authErr) throw new Error("player-ready AuthError: " + authErr.message)
    if (!user) throw new Error("player-ready Unauthorized: No User")

    const { franchise_id, league_id } = await req.json()
    if (!franchise_id || !league_id) throw new Error("franchise_id and league_id required")

    // Ensure franchise belongs to user
    const { data: fCheck } = await supabaseAdmin.from('franchises').select('id').eq('id', franchise_id).eq('user_id', user.id).single()
    if (!fCheck) throw new Error("Franchise not found or unauthorized")

    // Update readiness
    await supabaseAdmin.from('franchises').update({ is_ready: true }).eq('id', franchise_id)

    // Check if everyone is ready
    const { data: franchises } = await supabaseAdmin.from('franchises').select('id, is_ready, users!inner(role)').eq('league_id', league_id)
    
    let allReady = true
    if (franchises) {
      for (const f of franchises) {
        if (f.users?.role !== 'bot' && !f.is_ready) {
          allReady = false
          break
        }
      }
    }

    if (allReady && franchises && franchises.length > 0) {
      // Find the next unplayed week
      const { data: nextMatch } = await supabaseAdmin
        .from('matches')
        .select('week')
        .eq('league_id', league_id)
        .is('final_stats->played', null)
        .order('week', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (nextMatch) {
        const week = nextMatch.week
        // Reset readiness
        await supabaseAdmin.from('franchises').update({ is_ready: false }).eq('league_id', league_id)

        // Invoke match engine
        const functionUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/admin-simulate-match`
        const res = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ league_id, week })
        })

        const text = await res.text()
        let data: any = {}
        try { data = JSON.parse(text) } catch (e) {}

        if (!res.ok) {
          throw new Error(`Simulate edge error (${res.status}): ` + (data.error || text || 'Unknown'))
        }
        if (data.error) {
          throw new Error("Simulate error: " + data.error)
        }
        
        return new Response(JSON.stringify({ success: true, message: `Tüm takım menajerleri hazır! Hafta ${week} maçları oynandı!`, matchPlayed: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      } else {
        // No matches left
        return new Response(JSON.stringify({ success: true, message: `Sezondaki tüm maçlar oynanmış.`, matchPlayed: false }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }
    }

    return new Response(JSON.stringify({ success: true, message: 'Hazır durumunuz kaydedildi. Diğer menajerler bekleniyor.', matchPlayed: false }), {
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
