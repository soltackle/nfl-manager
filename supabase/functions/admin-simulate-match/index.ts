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

    // Check admin role
    const { data: dbUser } = await supabaseAdmin.from('users').select('role').eq('id', user.id).single()
    if (dbUser?.role !== 'admin') throw new Error('Unauthorized')

    const { league_id, week } = await req.json()

    // Get matches for the given week in the league
    const { data: matches, error: matchErr } = await supabaseAdmin
      .from('matches')
      .select('*, home_franchise_id, away_franchise_id')
      .eq('league_id', league_id)
      .eq('week', week)

    if (matchErr || !matches) throw new Error('Matches not found')

    for (const match of matches) {
      // Simulate simple score for now
      // A full match engine would evaluate depth charts and tactics here
      const homeScore = Math.floor(Math.random() * 35) + 7
      const awayScore = Math.floor(Math.random() * 35) + 7

      await supabaseAdmin.from('matches').update({
        home_score: homeScore,
        away_score: awayScore,
        final_stats: { played: true, summary: "Simulation complete." }
      }).eq('id', match.id)

      // Generate a mock drive log
      await supabaseAdmin.from('match_drive_logs').insert({
        match_id: match.id,
        plays: [
          { q1: "Maç başladı" },
          { q2: `Ev Sahibi sayı buldu: ${homeScore}` },
          { q4: `Deplasman sayı buldu: ${awayScore}` },
          { final: "Maç bitti" }
        ],
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 1 week
      })
    }

    return new Response(JSON.stringify({ success: true, message: `Hafta ${week} simüle edildi.` }), {
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
