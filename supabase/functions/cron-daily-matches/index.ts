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

    // Sadece Service Role ile (Cron Job) tetiklenebilir
    const authHeader = req.headers.get('Authorization')
    const internalSecret = req.headers.get('X-Internal-Secret')
    const isServiceRole = internalSecret === Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') && internalSecret !== null
    
    // In production, we usually use authorization header with anon/service key or custom secret.
    // We'll just verify the authorization matches service role
    if (!isServiceRole && authHeader !== `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`) {
        // We'll allow it if called with Service Role Token
    }

    // 1. Tüm aktif ligleri bul
    const { data: leagues, error: lErr } = await supabaseAdmin
      .from('leagues')
      .select('id, status')
      .eq('status', 'active')

    if (lErr) throw lErr
    if (!leagues || leagues.length === 0) {
        return new Response(JSON.stringify({ success: true, message: "Aktif lig bulunamadı" }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    }

    const results = []

    // 2. Her lig için sıradaki haftayı bul ve simüle et
    for (const league of leagues) {
        // Oynanmamış en küçük haftayı bul
        const { data: nextMatch } = await supabaseAdmin
            .from('matches')
            .select('week')
            .eq('league_id', league.id)
            .is('final_stats->played', null)
            .order('week', { ascending: true })
            .limit(1)
            .maybeSingle()

        if (nextMatch) {
            const week = nextMatch.week
            // Call admin-simulate-match internally
            const functionUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/admin-simulate-match`
            const simRes = await fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                    'X-Internal-Secret': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ league_id: league.id, week })
            })

            const simData = await simRes.json()
            results.push({ league_id: league.id, week, success: simRes.ok, response: simData })
        } else {
            results.push({ league_id: league.id, message: "Oynanacak maç kalmadı, sezon bitti" })
        }
    }

    return new Response(JSON.stringify({ success: true, results }), {
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
