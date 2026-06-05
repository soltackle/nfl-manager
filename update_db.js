import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function run() {
  const { data, error } = await supabaseAdmin.from('leagues').update({ match_time_utc: '14:00:00' }).in('status', ['waiting', 'draft', 'active'])
  console.log('Update result:', data, error)
  const { data: leagues } = await supabaseAdmin.from('leagues').select('id, name, match_time_utc')
  console.log('Current Leagues:', leagues)
}
run()
