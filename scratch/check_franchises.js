import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function check() {
  const { data } = await supabaseAdmin.from('franchises').select('id, user_id, team_name').eq('league_id', 'a0dfad5c-cbd8-4024-959e-0b1d9c1b1ecd')
  console.log(data)
  const { data: league } = await supabaseAdmin.from('leagues').select('status').eq('id', 'a0dfad5c-cbd8-4024-959e-0b1d9c1b1ecd').single()
  console.log("League Status:", league.status)
}
check()
