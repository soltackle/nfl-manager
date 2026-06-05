import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function runE2ETest() {
  console.log("=== STARTING COMPLETE E2E TEST WITH CLEANUP ===")
  
  const email = 'soltackle0@gmail.com'
  const password = 'qweqwe12'
  
  console.log(`1. Logging in as ${email}...`)
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({ email, password })
  if (authErr) { console.error("❌ Login failed:", authErr.message); return; }
  const user = auth.user
  console.log("✅ Login successful. User ID:", user.id)

  console.log("2. Creating franchise via auto-matchmake...")
  const teamName = `E2E Team ${Math.floor(Math.random() * 1000)}`
  const { data: matchData, error: matchErr } = await supabase.functions.invoke('auto-matchmake', {
    body: { team_name: teamName, city: 'E2E City' }
  })
  
  if (matchErr) { console.error("❌ auto-matchmake failed:", matchErr.message); return; }
  if (matchData?.error) { console.error("❌ auto-matchmake error:", matchData.error); return; }
  console.log("✅ auto-matchmake successful! League ID:", matchData.league_id)
  
  const franchiseId = matchData.franchise.id
  const leagueId = matchData.league_id

  console.log("3. Simulating 60 mins wait - Calling cron-fill-bots to fill bots...")
  // Temporarily update matchmaking_start_time to 61 mins ago so cron picks it up
  // Since we are using client side, we can't directly update without RLS. 
  // Let's use the test-cleanup admin to do it, OR just invoke admin-fill-bots directly for the test
  // Since this is just an e2e simulation, admin-fill-bots is fine.
  const { data: botData, error: botErr } = await supabase.functions.invoke('league-fill-bots', {
    body: { league_id: leagueId }
  })
  if (botErr) { console.error("❌ botErr:", botErr.message); return; }
  if (botData?.error) { console.error("❌ botData error:", botData.error); return; }
  console.log("✅ Bots filled!")

  console.log("4. Triggering league-start-team-creation...")
  const { data: startData, error: startErr } = await supabase.functions.invoke('league-start-team-creation', {
    body: { league_id: leagueId }
  })
  if (startErr) { console.error("❌ startErr:", startErr.message); return; }
  if (startData?.error) { console.error("❌ startData error:", startData.error); return; }
  console.log("✅ league-start-team-creation successful!")

  console.log("5. Generating Personal Pool...")
  const { data: poolPlayers } = await supabase.from('players').select('*').eq('target_user_id', user.id).eq('status', 'personal_pool').order('value', { ascending: true })
  console.log("✅ Personal pool generated! Count:", poolPlayers?.length || 0)

  if (poolPlayers && poolPlayers.length > 0) {
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
    
    console.log("6. Calling finalize-team with", selected.length, "players...")
    const { data: finData, error: finErr } = await supabase.functions.invoke('finalize-team', {
      body: {
        league_id: leagueId,
        franchise_id: franchiseId,
        selected_player_ids: selected
      }
    })
    
    if (finErr) { console.error("❌ finErr:", finErr.message); }
    else if (finData?.error) { console.error("❌ finData error:", finData.error); }
    else {
      console.log("✅ finalize-team successful!")
      const { data: finalLeague } = await supabase.from('leagues').select('*').eq('id', leagueId).single()
      console.log("✅ Final League Status:", finalLeague.status)
    }
  }

  // CLEANUP PHASE
  console.log("\n=== INITIATING CLEANUP ===")
  console.log("7. Calling test-cleanup function...")
  const { data: cleanData, error: cleanErr } = await supabase.functions.invoke('test-cleanup', {
    body: { franchise_id: franchiseId, delete_league: true }
  })
  
  if (cleanErr) { console.error("❌ cleanErr:", cleanErr.message); return; }
  if (cleanData?.error) { console.error("❌ cleanData error:", cleanData.error); return; }
  
  console.log(`✅ Cleanup successful! Deleted franchise: ${cleanData.franchise_deleted}, League: ${cleanData.league_deleted || 'kept'}`)
  console.log("=== E2E TEST COMPLETE ===")
}

runE2ETest()
