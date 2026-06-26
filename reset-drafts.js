import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function resetDrafts() {
  // 1. Find leagues in draft status
  const { data: leagues } = await supabaseAdmin.from('leagues').select('id, name').eq('status', 'draft')
  
  if (!leagues || leagues.length === 0) {
    console.log("Şu an draft aşamasında olan lig bulunamadı.")
    return
  }

  for (const league of leagues) {
    console.log(`Resetting league: ${league.name} (${league.id})`)
    
    // 2. Find the draft session for this league
    const { data: session } = await supabaseAdmin.from('draft_sessions').select('id').eq('league_id', league.id).single()
    
    if (session) {
      // 3. Find drafted players in this session
      const { data: picks } = await supabaseAdmin.from('draft_picks').select('player_id').eq('session_id', session.id)
      
      if (picks && picks.length > 0) {
        const playerIds = picks.map(p => p.player_id)
        // Release players back to the draft pool
        await supabaseAdmin.from('players').update({ franchise_id: null }).in('id', playerIds)
        console.log(`Released ${playerIds.length} players back to pool.`)
      }
      
      // Delete draft picks
      await supabaseAdmin.from('draft_picks').delete().eq('session_id', session.id)
      
      // Delete draft session
      await supabaseAdmin.from('draft_sessions').delete().eq('id', session.id)
    }
    
    // 4. Reset league status
    await supabaseAdmin.from('leagues').update({ status: 'waiting', draft_start_time: null }).eq('id', league.id)
    console.log(`League ${league.name} reset to waiting status.`)
  }
  
  console.log("Tüm sıkışan ligler başarıyla sıfırlandı!")
}

resetDrafts()
