import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function closeAllLeagues() {
  console.log("Closing all leagues...")
  const { data, error } = await supabaseAdmin.from('leagues').update({ status: 'completed' }).neq('status', 'completed')
  console.log("Done", error)
}
closeAllLeagues()
