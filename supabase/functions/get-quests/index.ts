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

    // Fetch quests
    let { data: quests } = await supabaseAdmin.from('user_quests').select('*').eq('user_id', user.id).single()

    const today = new Date().toISOString().split('T')[0]

    if (!quests) {
      // First time
      const { data: newQuests } = await supabaseAdmin.from('user_quests').insert({
        user_id: user.id,
        last_reset_date: today,
      }).select().single()
      quests = newQuests
    } else if (quests.last_reset_date !== today) {
      // Reset for new day
      const { data: resetted } = await supabaseAdmin.from('user_quests').update({
        last_reset_date: today,
        login_claimed: false,
        friendly_played: 0,
        friendly_claimed: false,
        shop_bought: 0,
        shop_claimed: false
      }).eq('user_id', user.id).select().single()
      quests = resetted
    }

    return new Response(JSON.stringify({ success: true, quests }), {
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
