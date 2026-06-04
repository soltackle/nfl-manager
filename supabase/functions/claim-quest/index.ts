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

    const { questType } = await req.json()
    if (!['login', 'friendly', 'shop'].includes(questType)) {
      throw new Error("Invalid quest type")
    }

    // Lock and get quests
    const { data: quests } = await supabaseAdmin.from('user_quests').select('*').eq('user_id', user.id).single()
    if (!quests) throw new Error("Quests not found")

    let reward = 0
    let updateData: any = {}

    if (questType === 'login') {
      if (quests.login_claimed) throw new Error("Already claimed")
      reward = 2
      updateData.login_claimed = true
    } else if (questType === 'friendly') {
      if (quests.friendly_played < 1) throw new Error("Görev tamamlanmamış")
      if (quests.friendly_claimed) throw new Error("Already claimed")
      reward = 3
      updateData.friendly_claimed = true
    } else if (questType === 'shop') {
      if (quests.shop_bought < 1) throw new Error("Görev tamamlanmamış")
      if (quests.shop_claimed) throw new Error("Already claimed")
      reward = 2
      updateData.shop_claimed = true
    }

    // Add coin
    const { data: dbUser } = await supabaseAdmin.from('users').select('amfutcoin').eq('id', user.id).single()
    await supabaseAdmin.from('users').update({ amfutcoin: (dbUser?.amfutcoin || 0) + reward }).eq('id', user.id)

    // Mark claimed
    await supabaseAdmin.from('user_quests').update(updateData).eq('user_id', user.id)

    return new Response(JSON.stringify({ success: true, reward }), {
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
