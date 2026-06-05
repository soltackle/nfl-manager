import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function run() {
  const { data: franchises } = await supabaseAdmin.from('franchises').select('id, user_id').eq('league_id', 'bc1e4d44-1983-4895-81c3-9b8ffe3e54b5').order('created_at', { ascending: true })
  
  // Create a mock session
  const session_id = '8872605b-cc59-4dc8-b111-eca8b2d47e51'
  const franchise_id = 'ab0b6639-e4b3-4826-b559-2eb69e29478b' // The next human turn
  
  // Find a player to pick
  const { data: players } = await supabaseAdmin.from('players').select('id').is('franchise_id', null).limit(1)
  const player_id = players[0].id
  
  console.log("Invoking with:", { franchise_id, session_id, player_id })
  
  const res = await fetch(`${process.env.SUPABASE_URL}/functions/v1/make-draft-pick`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      franchise_id,
      session_id,
      player_id,
      is_timeout: false
    })
  })
  
  const text = await res.text()
  console.log("Status:", res.status)
  console.log("Response:", text)
}
run()
