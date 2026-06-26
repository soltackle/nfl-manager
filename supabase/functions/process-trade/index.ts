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

    const { action, offer_id, league_id, receiver_franchise_id, offered_player_ids, offered_coins, requested_player_ids } = await req.json()

    // 1. Propose Trade
    if (action === 'propose') {
      const { data: sender } = await supabaseAdmin.from('franchises').select('id, budget').eq('user_id', user.id).eq('league_id', league_id).single()
      if (!sender) throw new Error('Sender franchise not found')
      
      if (sender.budget < (offered_coins || 0)) throw new Error('Yetersiz bütçe')

      // Check if proposing to a bot
      const { data: receiver } = await supabaseAdmin.from('franchises').select('id, user_id').eq('id', receiver_franchise_id).single()
      const { data: profile } = await supabaseAdmin.from('users').select('role').eq('id', receiver?.user_id).single()

      if (profile?.role === 'bot') {
        // AI Bot Logic to evaluate trade
        // Simple evaluation: Value of offered players + coins vs Value of requested players
        const { data: offP } = await supabaseAdmin.from('players').select('value').in('id', offered_player_ids || [])
        const { data: reqP } = await supabaseAdmin.from('players').select('value').in('id', requested_player_ids || [])
        
        const offVal = (offP?.reduce((s,p)=>s+p.value, 0) || 0) + (offered_coins || 0)
        const reqVal = (reqP?.reduce((s,p)=>s+p.value, 0) || 0)

        // Bot wants a 10% premium to accept a trade from a human
        if (offVal >= reqVal * 1.1) {
          // Accept automatically via system
          // We will just create the offer and immediately process it in the background or right here.
          // For simplicity, we'll just throw an error if rejected, or create it as 'accepted' directly.
        } else {
          throw new Error('Bot: Teklifin çok düşük, oyuncularımın değeri daha yüksek.')
        }
      }

      const { data: offer, error } = await supabaseAdmin.from('trade_offers').insert({
        league_id,
        sender_franchise_id: sender.id,
        receiver_franchise_id: receiver_franchise_id,
        offered_player_ids: offered_player_ids || [],
        offered_coins: offered_coins || 0,
        requested_player_ids: requested_player_ids || [],
        status: profile?.role === 'bot' ? 'accepted' : 'pending'
      }).select().single()

      if (error) throw error

      if (profile?.role === 'bot' && offer) {
        // Execute the trade immediately if bot accepted
        return executeTrade(supabaseAdmin, offer.id)
      }

      return new Response(JSON.stringify({ success: true, offer }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 2. Accept Trade
    if (action === 'accept') {
      return executeTrade(supabaseAdmin, offer_id, user.id)
    }

    // 3. Reject/Cancel Trade
    if (action === 'reject' || action === 'cancel') {
      const { error } = await supabaseAdmin.from('trade_offers').update({ status: action }).eq('id', offer_id)
      if (error) throw error
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

async function executeTrade(supabaseAdmin: unknown, offer_id: string, user_id?: string) {
  const { data: offer } = await supabaseAdmin.from('trade_offers').select('*').eq('id', offer_id).single()
  if (!offer || offer.status !== 'pending' && offer.status !== 'accepted') throw new Error('Geçersiz teklif')

  if (user_id) {
    // Verify receiver
    const { data: receiver } = await supabaseAdmin.from('franchises').select('user_id').eq('id', offer.receiver_franchise_id).single()
    if (receiver?.user_id !== user_id) throw new Error('Yetkisiz işlem')
  }

  // Get both franchises
  const { data: sender } = await supabaseAdmin.from('franchises').select('*').eq('id', offer.sender_franchise_id).single()
  const { data: receiver } = await supabaseAdmin.from('franchises').select('*').eq('id', offer.receiver_franchise_id).single()

  if (sender.budget < offer.offered_coins) throw new Error('Gönderenin bütçesi yetersiz')

  // Transfer players
  if (offer.offered_player_ids.length > 0) {
    await supabaseAdmin.from('players').update({ franchise_id: receiver.id }).in('id', offer.offered_player_ids)
  }
  if (offer.requested_player_ids.length > 0) {
    await supabaseAdmin.from('players').update({ franchise_id: sender.id }).in('id', offer.requested_player_ids)
  }

  // Transfer coins
  if (offer.offered_coins > 0) {
    await supabaseAdmin.from('franchises').update({ budget: sender.budget - offer.offered_coins }).eq('id', sender.id)
    await supabaseAdmin.from('franchises').update({ budget: receiver.budget + offer.offered_coins }).eq('id', receiver.id)
  }

  // Update offer status
  await supabaseAdmin.from('trade_offers').update({ status: 'completed' }).eq('id', offer_id)

  // Send system message to chat
  await supabaseAdmin.from('league_chat').insert({
    league_id: offer.league_id,
    message: `FLAŞ HABER: ${sender.name} ve ${receiver.name} arasında dev takas gerçekleşti!`,
    is_system: true
  })

  return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}
