import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function checkLeague() {
  const { data } = await supabaseAdmin.from('leagues').select('*').eq('id', 'c1401c74-7529-4541-9193-36db3c759899').single()
  console.log("League:", data)
  
  if (data) {
    const { count } = await supabaseAdmin.from('franchises').select('*', { count: 'exact', head: true }).eq('league_id', data.id)
    console.log("Franchises:", count)
  }
}
checkLeague()
