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

    const { mission_id } = await req.json()
    if (!mission_id) throw new Error('Missing mission_id')

    // Fetch the mission
    const { data: mission, error: mErr } = await supabaseAdmin
      .from('scout_missions')
      .select('*')
      .eq('id', mission_id)
      .eq('user_id', user.id)
      .single()

    if (mErr || !mission) throw new Error('Görev bulunamadı veya yetkisiz.')
    if (mission.status === 'claimed') throw new Error('Bu oyuncu zaten alındı.')

    const now = new Date()
    const endTime = new Date(mission.end_time)

    if (now < endTime) {
      throw new Error(`Süre henüz dolmadı. Lütfen bekleyin.`)
    }

    if (!mission.player_data) {
       throw new Error('Oyuncu verisi bulunamadı.')
    }

    // Insert player into franchise roster
    const newPlayer = {
      ...mission.player_data,
      franchise_id: mission.franchise_id
    }

    const { error: pErr } = await supabaseAdmin.from('players').insert([newPlayer])
    if (pErr) throw new Error('Oyuncu kadroya eklenirken hata oluştu: ' + pErr.message)

    // Mark as claimed
    await supabaseAdmin
      .from('scout_missions')
      .update({ status: 'claimed' })
      .eq('id', mission_id)

    return new Response(JSON.stringify({ success: true, message: 'Oyuncu kadroya eklendi!' }), {
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
