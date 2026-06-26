import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function checkFranchise() {
  const { data } = await supabaseAdmin.from('franchises').select('*').eq('league_id', '6f5650c4-a176-454a-910d-70cc67e98328')
  console.log("Franchises:", data.map(f => ({ id: f.id, user_id: f.user_id, is_ready: f.is_ready })))
}
checkFranchise()
