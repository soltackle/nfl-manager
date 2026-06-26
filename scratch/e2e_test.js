import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testFlow() {
  console.log("=== STARTING E2E TEST FLOW ===")
  
  // 1. Sign in (Assume test user)
  const email = 'soltackle0@gmail.com'
  const password = 'qweqwe12'
  console.log(`1. Logging in as ${email}...`)
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  if (authErr) {
    console.error("❌ Login failed:", authErr.message)
    return
  }
  console.log("✅ Login successful. User ID:", auth.user.id)
  
  // 2. Clear out user's active franchises just in case
  console.log("2. Cleaning up old test franchises...")
  // We can't delete easily without admin, but we can just use edge function.
  
  // 3. Test auto-matchmake
  console.log("3. Calling auto-matchmake...")
  const teamName = `E2E Team ${Math.floor(Math.random() * 1000)}`
  const { data: matchData, error: matchErr } = await supabase.functions.invoke('auto-matchmake', {
    body: { team_name: teamName, city: 'E2E City' }
  })
  
  if (matchErr) {
    console.error("❌ auto-matchmake failed (Function Error):", matchErr.message)
    return
  }
  if (matchData?.error) {
    console.error("❌ auto-matchmake failed (Logic Error):", matchData.error)
    return
  }
  console.log("✅ auto-matchmake successful!", matchData)
  
  const leagueId = matchData.league_id
  
  // 4. Verify league status
  console.log("4. Fetching league status...")
  const { data: league, error: lErr } = await supabase.from('leagues').select('*').eq('id', leagueId).single()
  if (lErr) {
    console.error("❌ Failed to fetch league:", lErr.message)
    return
  }
  console.log("✅ League Status:", league.status)
  
  console.log("=== E2E TEST FLOW SUCCESS ===")
}

testFlow()
