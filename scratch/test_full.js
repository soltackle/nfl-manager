import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)
const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function testFull() {
  const email = `test${Date.now()}@test.com`
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: 'password123',
    options: { data: { username: 'TestUser' } }
  })
  if (authError) return console.error("Auth error:", authError)
  
  const token = authData.session.access_token
  
  const { data: league, error: lErr } = await supabaseAdmin.from('leagues').insert({
    name: 'Test League',
    status: 'waiting',
    is_public: true,
    owner_user_id: authData.user.id,
    matchmaking_start_time: new Date().toISOString()
  }).select().single()
  
  if (lErr) return console.error("League error:", lErr)
  
  console.log("Invoking league-fill-bots on league:", league.id)
  const res = await fetch(process.env.VITE_SUPABASE_URL + '/functions/v1/league-fill-bots', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ league_id: league.id })
  })
  
  const text = await res.text()
  console.log("Status:", res.status)
  console.log("Body:", text)
}
testFull()
