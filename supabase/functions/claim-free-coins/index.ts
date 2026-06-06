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

    // Fetch user record
    const { data: dbUser, error: dbErr } = await supabaseAdmin
      .from('users')
      .select('id, amfutcoin, last_coin_claim_at')
      .eq('id', user.id)
      .single()

    if (dbErr || !dbUser) throw new Error('User not found')

    const now = new Date()
    let canClaim = false

    if (!dbUser.last_coin_claim_at) {
      canClaim = true
    } else {
      const lastClaim = new Date(dbUser.last_coin_claim_at)
      const diffHours = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60)
      if (diffHours >= 4) {
        canClaim = true
      }
    }

    if (!canClaim) {
      const lastClaim = new Date(dbUser.last_coin_claim_at)
      const nextClaim = new Date(lastClaim.getTime() + 4 * 60 * 60 * 1000)
      throw new Error(`Henüz 4 saat dolmadı! Bir sonraki alış zamanı: ${nextClaim.toLocaleTimeString('tr-TR')}`)
    }

    // Update
    const { error: updateErr } = await supabaseAdmin
      .from('users')
      .update({ 
        amfutcoin: (dbUser.amfutcoin || 0) + 50,
        last_coin_claim_at: now.toISOString()
      })
      .eq('id', user.id)

    if (updateErr) throw new Error('Bakiye güncellenirken hata oluştu: ' + updateErr.message)

    return new Response(JSON.stringify({ success: true, message: '50 Amfutcoin kazandınız!', newBalance: (dbUser.amfutcoin || 0) + 50 }), {
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
