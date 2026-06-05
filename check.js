import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function run() {
  const { data: league, error } = await supabaseAdmin.from('leagues').select('*, franchises(*)').eq('name', 'dfjjdhdfhdf').single()
  console.log(league.franchises.map(f => ({ name: f.team_name, city: f.city, uid: f.user_id })))
}
run()
