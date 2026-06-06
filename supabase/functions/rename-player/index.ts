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

    const { player_id, new_name } = await req.json()
    if (!player_id || !new_name) throw new Error('player_id and new_name required')
    
    const trimmedName = String(new_name).trim()
    if (trimmedName.length < 3 || trimmedName.length > 30) {
      throw new Error('İsim 3 ile 30 karakter arasında olmalıdır.')
    }

    // Verify player belongs to user's franchise
    const { data: franchise, error: fErr } = await supabaseAdmin
      .from('franchises')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (fErr || !franchise) throw new Error('Kullanıcıya ait takım bulunamadı.')

    const { data: player, error: pErr } = await supabaseAdmin
      .from('players')
      .select('id')
      .eq('id', player_id)
      .eq('franchise_id', franchise.id)
      .single()

    if (pErr || !player) throw new Error('Bu oyuncu size ait değil veya bulunamadı.')

    // Update name
    const { error: updateErr } = await supabaseAdmin
      .from('players')
      .update({ name: trimmedName })
      .eq('id', player_id)

    if (updateErr) throw new Error('İsim güncellenemedi: ' + updateErr.message)

    return new Response(JSON.stringify({ success: true, message: 'Oyuncu ismi güncellendi!' }), {
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
