import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function runSeasonEnd() {
  console.log('Season end script started')
  
  // Find leagues that are active and reached week 7 (simplified season length)
  const { data: leagues } = await supabase.from('leagues').select('id').eq('status', 'active')
  if (!leagues || leagues.length === 0) return console.log('No active leagues')
  
  for (const league of leagues) {
    // Distribute rewards based on standings
    const { data: members } = await supabase.from('league_members')
      .select('*')
      .eq('league_id', league.id)
      .order('points', { ascending: false })
      
    if (members && members.length > 0) {
      for (let i = 0; i < members.length; i++) {
        const reward = i === 0 ? 500 : (i === 1 ? 250 : 50)
        
        const { data: user } = await supabase.from('users').select('amfutcoin, manager_xp').eq('id', members[i].user_id).single()
        if (user) {
          await supabase.from('users').update({
            amfutcoin: user.amfutcoin + reward,
            manager_xp: user.manager_xp + 100
          }).eq('id', members[i].user_id)
        }
      }
    }
    
    // Reset all players in this league to null franchise_id
    const { data: franchises } = await supabase.from('franchises').select('id').eq('league_id', league.id)
    if (franchises && franchises.length > 0) {
      const franchiseIds = franchises.map(f => f.id)
      await supabase.from('players').update({ franchise_id: null }).in('franchise_id', franchiseIds)
      
      // Also delete depth charts and tactics for reset
      await supabase.from('depth_charts').delete().in('franchise_id', franchiseIds)
    }
    
    // Set league status to waiting
    await supabase.from('leagues').update({ status: 'waiting' }).eq('id', league.id)
    
    // Reset points
    await supabase.from('league_members').update({ points: 0, form_streak: 0 }).eq('league_id', league.id)
  }
  
  console.log('Season end completed')
}

runSeasonEnd().catch(console.error)
