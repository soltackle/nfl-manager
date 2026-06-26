import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function run() {
  // 1. login
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'soltackle0@gmail.com',
    password: 'qweqwe12'
  })
  console.log("Auth:", authErr ? authErr.message : "Success")

  // 2. get active draft session
  const { data: session } = await supabase.from('draft_sessions').select('*').limit(1).single()
  console.log("Draft session:", session)

  if (!session) return console.log("No active draft session")

  // 3. invoke edge function
  const { data, error } = await supabase.functions.invoke('make-draft-pick', {
    body: {
      franchise_id: session.current_pick_franchise_id,
      session_id: session.id,
      player_id: null
    }
  })

  console.log("Edge Function Response Data:", data)
  console.log("Edge Function Response Error:", error)
}

run()
