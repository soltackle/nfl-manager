import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function debugLeague() {
  const { data: leagues } = await supabaseAdmin.from('leagues').select('*').order('created_at', { ascending: false }).limit(2)
  for (const lg of leagues) {
    const { data: franchises } = await supabaseAdmin.from('franchises').select('id, user_id').eq('league_id', lg.id)
    console.log(`League: ${lg.name} (${lg.id}), Status: ${lg.status}, Franchises: ${franchises?.length}`)
  }
}
debugLeague()
