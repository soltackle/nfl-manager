import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function run() {
  const { data: session } = await supabaseAdmin.from('draft_sessions').select('*').limit(1).single()
  if (!session) {
    console.log("No active draft session")
    return
  }
  
  console.log("Session:", session)
  
  const { data: franchise } = await supabaseAdmin.from('franchises').select('*').eq('id', session.current_pick_franchise_id).single()
  console.log("Franchise to pick:", franchise)
  
  // Let's manually run the bot pick algorithm
  let { data: available } = await supabaseAdmin
      .from('players')
      .select('id, position, overall')
      .is('franchise_id', null)
      .order('overall', { ascending: false })

  console.log("Available players:", available?.length)
  
  if (!available || available.length === 0) {
    console.log("NO PLAYERS AVAILABLE!")
    return
  }
  
  // Fetch roster
  const { data: roster } = await supabaseAdmin
    .from('players')
    .select('position, overall')
    .eq('franchise_id', franchise.id)
    
  console.log("Roster size:", roster?.length)
  
  const rosterCount = {}
  const maxOverall = {}
  const positions = ['QB', 'RB', 'WR', 'TE', 'OL', 'DE', 'LB', 'CB', 'S', 'K']
  
  positions.forEach(p => { rosterCount[p] = 0; maxOverall[p] = 0; })
  if (roster) {
    roster.forEach(p => {
      rosterCount[p.position] = (rosterCount[p.position] || 0) + 1
      if (p.overall > maxOverall[p.position]) maxOverall[p.position] = p.overall
    })
  }

  let needPos = null
  if (maxOverall['QB'] < 70 && rosterCount['QB'] < 1) needPos = 'QB'
  else if (maxOverall['OL'] < 65 && rosterCount['OL'] < 5) needPos = 'OL'
  else if (rosterCount['K'] === 0) needPos = 'K'

  let currentPlayerId = null
  if (needPos) {
    const bestNeedIndex = available.findIndex(p => p.position === needPos)
    if (bestNeedIndex !== -1) {
      currentPlayerId = available[bestNeedIndex].id
    }
  }

  if (!currentPlayerId) {
    currentPlayerId = available[0].id
  }
  
  console.log("Selected Player ID:", currentPlayerId)
  
  const { data: playerDetails } = await supabaseAdmin.from('players').select('*').eq('id', currentPlayerId).single()
  console.log("Player:", playerDetails.name, playerDetails.position, playerDetails.overall)
}
run()
