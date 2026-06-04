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
    if (authErr || !user) throw new Error("Unauthorized")

    const { type, target_id, league_id } = await req.json()
    if (!type || !target_id) throw new Error("Missing parameters")

    // 1. Get User Balance
    const { data: dbUser } = await supabaseAdmin.from('users').select('amfutcoin').eq('id', user.id).single()
    if (!dbUser) throw new Error("User not found")

    const currentCoin = dbUser.amfutcoin || 0
    let cost = 0
    let message = ''

    if (type === 'boost') {
      cost = 15
      if (currentCoin < cost) throw new Error("Yetersiz bakiye (15 AmFutCoin gereklidir)")

      // Set active_boost
      const { error: boostErr } = await supabaseAdmin.from('franchises').update({ active_boost: 'power_boost' }).eq('id', target_id).eq('user_id', user.id)
      if (boostErr) throw new Error("Boost uygulanamadı: " + boostErr.message)

      message = "Maç öncesi takviye başarıyla uygulandı! Sıradaki resmi maçınızda takımınız +5 OVR avantajla oynayacaktır."
    } else if (type === 'develop') {
      cost = 20
      if (currentCoin < cost) throw new Error("Yetersiz bakiye (20 AmFutCoin gereklidir)")

      // Get player
      const { data: player } = await supabaseAdmin.from('players').select('overall, franchise_id').eq('id', target_id).single()
      if (!player) throw new Error("Oyuncu bulunamadı")

      // Ensure player belongs to user's franchise
      const { data: franchise } = await supabaseAdmin.from('franchises').select('id').eq('id', player.franchise_id).eq('user_id', user.id).single()
      if (!franchise) throw new Error("Bu oyuncu size ait değil")

      // Add +1 OVR
      const { error: devErr } = await supabaseAdmin.from('players').update({ overall: player.overall + 1 }).eq('id', target_id)
      if (devErr) throw new Error("Oyuncu geliştirilemedi: " + devErr.message)

      message = `Oyuncunuz özel kampa girdi ve başarıyla +1 OVR kazandı! Yeni OVR: ${player.overall + 1}`
    } else {
      throw new Error("Geçersiz işlem tipi")
    }

    // Deduct coins
    await supabaseAdmin.from('users').update({ amfutcoin: currentCoin - cost }).eq('id', user.id)

    return new Response(JSON.stringify({ success: true, message }), {
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
