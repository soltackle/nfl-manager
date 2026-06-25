import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * cron-fill-bots
 * ──────────────
 * Her 5 dakikada bir Supabase Cron / Vercel Cron tarafından tetiklenir.
 * 'waiting' durumundaki ve matchmaking_start_time'ı 60 dakikayı geçmiş
 * tüm ligleri bulur, eksik yerleri botlarla doldurur ve
 * league-start-team-creation fonksiyonunu tetikler.
 *
 * Auth gerekmez – service_role_key ile çalışır.
 * Cron'dan gelen isteklerde Authorization header'ı yoktur;
 * bu yüzden ya Authorization boş olabilir ya da
 * CRON_SECRET header'ı ile doğrulama yapılır.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Güvenlik: Cron secret kontrolü (opsiyonel ama önerilir)
    const cronSecret = req.headers.get('x-cron-secret')
    const expectedSecret = Deno.env.get('CRON_SECRET')
    // Eğer CRON_SECRET env var tanımlıysa kontrol et
    if (expectedSecret && cronSecret !== expectedSecret) {
      // Ayrıca Authorization header ile de çağrılabilir (admin)
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) {
        throw new Error('Unauthorized: Missing cron secret or auth header')
      }
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. waiting durumunda ve 60 dakikası geçmiş ligleri bul
    const sixtyMinutesAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    const { data: expiredLeagues, error: leagueErr } = await supabaseAdmin
      .from('leagues')
      .select('id, name, matchmaking_start_time')
      .eq('status', 'waiting')
      .lt('matchmaking_start_time', sixtyMinutesAgo)

    if (leagueErr) throw leagueErr

    if (!expiredLeagues || expiredLeagues.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No expired leagues found', filled: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const results: { league_id: string; bots_added: number }[] = []

    const botCities = ['Los Angeles', 'Miami', 'Chicago', 'Dallas', 'Seattle', 'Denver', 'Boston']
    const botMascots = ['Tigers', 'Sharks', 'Dragons', 'Panthers', 'Cobras', 'Knights', 'Eagles']

    for (const league of expiredLeagues) {
      // Mevcut franchise sayısını kontrol et
      const { data: franchises } = await supabaseAdmin
        .from('franchises')
        .select('id')
        .eq('league_id', league.id)

      const currentCount = franchises?.length || 0
      const needed = 8 - currentCount

      if (needed <= 0) {
        // Zaten dolu ama hâlâ waiting durumunda – direkt team creation tetikle
        await supabaseAdmin.functions.invoke('league-start-team-creation', {
          body: { league_id: league.id }
        })
        results.push({ league_id: league.id, bots_added: 0 })
        continue
      }

      // Bot profilleri ve franchise'ları oluştur
      for (let i = 0; i < needed; i++) {
        const botId = crypto.randomUUID()
        const cityIdx = (currentCount + i) % botCities.length
        const mascotIdx = (currentCount + i) % botMascots.length

        // users tablosuna bot kullanıcı ekle
        const { error: profileErr } = await supabaseAdmin.from('users').insert({
          id: botId,
          email: `bot_${botId.substring(0, 8)}@nflmanager.bot`,
          username: `Bot_${botMascots[mascotIdx]}_${Math.floor(Math.random() * 1000)}`,
          role: 'bot'
        })

        if (profileErr) {
          console.error(`Bot profile insert error: ${profileErr.message}`)
          continue
        }

        // franchise oluştur
        const { error: franchiseErr } = await supabaseAdmin.from('franchises').insert({
          league_id: league.id,
          user_id: botId,
          team_name: `${botCities[cityIdx]} ${botMascots[mascotIdx]}`,
          city: botCities[cityIdx],
          budget: 100000000,
          club_fund: 0,
          morale: 100,
          is_ready: true
        })

        if (franchiseErr) {
          console.error(`Bot franchise insert error: ${franchiseErr.message}`)
        }
      }

      // Takım oluşturma fazını tetikle
      const { error: tcErr } = await supabaseAdmin.functions.invoke('league-start-team-creation', {
        body: { league_id: league.id }
      })

      if (tcErr) {
        console.error(`league-start-team-creation error for ${league.id}: ${tcErr.message}`)
      }

      results.push({ league_id: league.id, bots_added: needed })
    }

    return new Response(JSON.stringify({
      success: true,
      message: `${results.length} league(s) processed`,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: unknown) {
    console.error('cron-fill-bots error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})
