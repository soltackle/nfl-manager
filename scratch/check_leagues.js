import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function checkLatestLeague() {
  const { data: leagues, error } = await supabaseAdmin.from('leagues').select('id, name, status, created_at, matchmaking_start_time').order('created_at', { ascending: false }).limit(3)
  console.log("Latest Leagues:", leagues)
  
  if (leagues && leagues.length > 0) {
    const lId = leagues[0].id
    const { count } = await supabaseAdmin.from('franchises').select('*', { count: 'exact', head: true }).eq('league_id', lId)
    console.log("Franchises count for latest league:", count)
  }
}
checkLatestLeague()
