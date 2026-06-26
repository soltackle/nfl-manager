import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testFlow() {
  const email = 'soltackle0@gmail.com'
  const password = 'qweqwe12'
  const { data: auth } = await supabase.auth.signInWithPassword({ email, password })
  const user = auth.user
  
  const teamName = `E2E Team ${Math.floor(Math.random() * 1000)}`
  const { data: matchData } = await supabase.functions.invoke('auto-matchmake', {
    body: { team_name: teamName, city: 'E2E City' }
  })
  
  // Fill bots using fill-bots edge function
  console.log("Filling bots...")
  const { data: botData, error: botErr } = await supabase.functions.invoke('admin-fill-bots', {
    body: { league_id: matchData.league_id }
  })
  if (botErr) { console.error("❌ botErr:", botErr.message); return; }
  if (botData?.error) { console.error("❌ botData error:", botData.error); return; }
  console.log("✅ Bots filled!")
  
  console.log("5. Triggering league-start-team-creation...")
  const { data: startData, error: startErr } = await supabase.functions.invoke('league-start-team-creation', {
    body: { league_id: matchData.league_id }
  })
  if (startErr) { console.error("❌ startErr:", startErr.message); return; }
  if (startData?.error) { console.error("❌ startData error:", startData.error); return; }
  console.log("✅ league-start-team-creation successful!")
  
  const { data: poolPlayers } = await supabase.from('players').select('*').eq('target_user_id', user.id).eq('status', 'personal_pool')
  console.log("✅ Personal pool generated! Count:", poolPlayers.length)
  
  if (poolPlayers.length > 0) {
    const selected = []
    const addPlayer = (pos) => {
      const p = poolPlayers.find(p => p.position === pos && !selected.includes(p.id))
      if (p) selected.push(p.id)
    }
    addPlayer('QB')
    addPlayer('RB')
    addPlayer('WR')
    addPlayer('WR')
    addPlayer('TE')
    addPlayer('OL')
    addPlayer('DE')
    addPlayer('LB')
    addPlayer('CB')
    addPlayer('S')
    addPlayer('K')
    
    console.log("7. Calling finalize-team with", selected.length, "players...")
    const { data: finData, error: finErr } = await supabase.functions.invoke('finalize-team', {
      body: {
        league_id: matchData.league_id,
        franchise_id: matchData.franchise.id,
        selected_player_ids: selected
      }
    })
    
    if (finErr) { console.error("❌ finErr:", finErr.message); return; }
    if (finData?.error) { console.error("❌ finData error:", finData.error); return; }
    console.log("✅ finalize-team successful!")
    
    const { data: finalLeague } = await supabase.from('leagues').select('*').eq('id', matchData.league_id).single()
    console.log("✅ Final League Status:", finalLeague.status)
  }
}

testFlow()
