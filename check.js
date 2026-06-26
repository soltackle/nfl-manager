import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function run() {
  const { data: players, error } = await supabaseAdmin.from('players').select('name').like('name', 'ERROR:%')
  console.log("Error rows:", players, error)
}
run()
