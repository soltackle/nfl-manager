import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

// USE SERVICE ROLE TO BYPASS RLS
const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function checkAdmin() {
  const { data } = await supabaseAdmin.from('profiles').select('*').limit(5)
  console.log('Profiles:', data)
}
checkAdmin()
