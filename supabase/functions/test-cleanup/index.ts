import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * test-cleanup
 * ────────────
 * E2E testlerden sonra oluşturulan franchise'ı ve ilişkili tüm verileri siler.
 * Sadece franchise sahibi veya admin kullanabilir.
 *
 * Body: { franchise_id: string, delete_league?: boolean }
 *   - franchise_id: Silinecek franchise
 *   - delete_league: true ise franchise'ın bağlı olduğu lig de silinir
 *     (sadece ligdeki tüm franchise'lar bot ise veya tek kişi kaldıysa)
 */
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
    const token = authHeader.replace('Bearer ', '')

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token)
    if (userError || !userData?.user) throw new Error('Invalid token')
    const user = userData.user

    const { franchise_id, delete_league } = await req.json()
    if (!franchise_id) throw new Error('franchise_id is required')

    // Franchise'ı getir
    const { data: franchise, error: fErr } = await supabaseAdmin
      .from('franchises')
      .select('id, league_id, user_id')
      .eq('id', franchise_id)
      .single()

    if (fErr || !franchise) throw new Error('Franchise not found')

    // Yetki kontrolü: franchise sahibi veya admin
    if (franchise.user_id !== user.id) {
      const { data: profile } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
      if (!profile || profile.role !== 'admin') {
        throw new Error('Unauthorized: You can only delete your own franchise')
      }
    }

    const leagueId = franchise.league_id

    // 1. Franchise'a ait oyuncuları sil
    await supabaseAdmin
      .from('players')
      .delete()
      .eq('franchise_id', franchise_id)

    // 2. Franchise sahibinin personal pool oyuncularını sil
    await supabaseAdmin
      .from('players')
      .delete()
      .eq('target_user_id', franchise.user_id)
      .eq('status', 'personal_pool')

    // 3. Franchise'ı sil
    const { error: delErr } = await supabaseAdmin
      .from('franchises')
      .delete()
      .eq('id', franchise_id)

    if (delErr) throw new Error(`Franchise delete failed: ${delErr.message}`)

    // 4. Opsiyonel: Ligi de temizle
    let leagueDeleted = false
    if (delete_league && leagueId) {
      // Ligdeki kalan franchise'ları kontrol et
      const { data: remaining } = await supabaseAdmin
        .from('franchises')
        .select('id, user_id')
        .eq('league_id', leagueId)

      // Kalan franchise'lar sadece botlarsa veya hiç kalmadıysa ligi sil
      if (!remaining || remaining.length === 0) {
        // Ligdeki oyuncuları sil
        await supabaseAdmin.from('players').delete().eq('league_id', leagueId)
        // Ligi sil
        await supabaseAdmin.from('leagues').delete().eq('id', leagueId)
        leagueDeleted = true
      } else {
        // Kalanların hepsi bot mu?
        const userIds = remaining.map(f => f.user_id)
        const { data: profiles } = await supabaseAdmin
          .from('users')
          .select('id, role')
          .in('id', userIds)

        const allBots = profiles?.every(p => p.role === 'bot')
        if (allBots) {
          // Tüm bot franchise'ları sil
          for (const f of remaining) {
            await supabaseAdmin.from('players').delete().eq('franchise_id', f.id)
            await supabaseAdmin.from('franchises').delete().eq('id', f.id)
          }
          // Bot profilleri sil
          for (const p of (profiles || [])) {
            await supabaseAdmin.from('users').delete().eq('id', p.id)
          }
          // Ligdeki kalan oyuncuları sil
          await supabaseAdmin.from('players').delete().eq('league_id', leagueId)
          // Ligi sil
          await supabaseAdmin.from('leagues').delete().eq('id', leagueId)
          leagueDeleted = true
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      franchise_deleted: franchise_id,
      league_deleted: leagueDeleted ? leagueId : null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: unknown) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})
