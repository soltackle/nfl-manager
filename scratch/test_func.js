import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function testFunction() {
  // we need a valid user token to test the function properly
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'admin@admin.com', // replace with a real user
    password: 'password123'
  })
  
  if (authErr) {
    console.error("Auth error:", authErr)
    return
  }
  
  const { data, error } = await supabase.functions.invoke('auto-matchmake', {
    body: { team_name: 'Test Team', city: 'Test City' }
  })
  
  console.log("Function response:", data, error)
}
testFunction()
