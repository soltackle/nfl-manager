import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function fixStuckLeagues() {
  const { data: leagues } = await supabaseAdmin.from('leagues').select('id, status').eq('status', 'waiting')
  for (const l of leagues) {
    const { count } = await supabaseAdmin.from('franchises').select('*', { count: 'exact', head: true }).eq('league_id', l.id)
    if (count === 8) {
      console.log(`Updating stuck league ${l.id} to draft...`)
      await supabaseAdmin.from('leagues').update({ status: 'draft' }).eq('id', l.id)
    }
  }
}
fixStuckLeagues()
