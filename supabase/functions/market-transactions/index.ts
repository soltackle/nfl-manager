import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

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
    if (!authHeader) throw new Error('Missing Auth Header')
    const token = authHeader.replace('Bearer ', '')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token)
    if (userError || !userData?.user) throw new Error('Invalid token')
    const user = userData.user

    const { action, player_id, franchise_id, list_price } = await req.json()

    if (!franchise_id || !player_id) throw new Error('Missing required fields')

    // Verify franchise belongs to user
    const { data: franchise } = await supabaseAdmin.from('franchises').select('id, budget, team_name, league_id').eq('id', franchise_id).eq('user_id', user.id).single()
    if (!franchise) throw new Error('Unauthorized franchise')

    const { data: player } = await supabaseAdmin.from('players').select('*').eq('id', player_id).single()
    if (!player) throw new Error('Player not found')

    if (action === 'list_player') {
      if (player.franchise_id !== franchise.id) throw new Error('Not your player')
      if (player.status !== 'roster') throw new Error('Player is not on your active roster')
      if (!list_price || list_price < 1000) throw new Error('Geçersiz fiyat')

      await supabaseAdmin.from('players').update({
        status: 'listed_for_sale',
        listed_price: list_price
      }).eq('id', player_id)

      await supabaseAdmin.from('league_chat').insert({
        league_id: franchise.league_id,
        message: `TRANSFER LİSTESİ: ${franchise.team_name}, ${player.name} isimli oyuncuyu $${list_price} fiyatla satışa çıkardı!`,
        is_system: true
      })

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'buy_fa') {
      if (player.status !== 'free_agent') throw new Error('Player is not a free agent')
      if (franchise.budget < player.value) throw new Error('Yetersiz bütçe')

      await supabaseAdmin.from('franchises').update({ budget: franchise.budget - player.value }).eq('id', franchise.id)
      await supabaseAdmin.from('players').update({ status: 'roster', franchise_id: franchise.id }).eq('id', player_id)

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'buy_listed') {
      if (player.status !== 'listed_for_sale') throw new Error('Player is not listed for sale')
      if (!player.listed_price) throw new Error('Player has no listed price')
      if (player.franchise_id === franchise.id) throw new Error('Kendi oyuncunu alamazsın')
      if (franchise.budget < player.listed_price) throw new Error('Yetersiz bütçe')

      const { data: seller } = await supabaseAdmin.from('franchises').select('id, budget').eq('id', player.franchise_id).single()
      if (!seller) throw new Error('Seller not found')

      const tax = Math.floor(player.listed_price * 0.05)
      const sellerReceives = player.listed_price - tax

      // Deduct from buyer
      await supabaseAdmin.from('franchises').update({ budget: franchise.budget - player.listed_price }).eq('id', franchise.id)
      
      // Add to seller (minus tax)
      await supabaseAdmin.from('franchises').update({ budget: seller.budget + sellerReceives }).eq('id', seller.id)

      // Transfer player
      await supabaseAdmin.from('players').update({
        status: 'roster',
        franchise_id: franchise.id,
        listed_price: null
      }).eq('id', player_id)

      await supabaseAdmin.from('league_chat').insert({
        league_id: franchise.league_id,
        message: `FLAŞ HABER: ${franchise.team_name}, ${player.name}'i $${player.listed_price} ödeyerek transfer etti!`,
        is_system: true
      })

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    throw new Error('Invalid action')

  } catch (error: unknown) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
