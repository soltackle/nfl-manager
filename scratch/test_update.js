import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function testUpdate() {
  console.log("Updating to team_creation...")
  const { data, error } = await supabaseAdmin.from('leagues').update({ status: 'team_creation' }).eq('id', 'a0dfad5c-cbd8-4024-959e-0b1d9c1b1ecd').select()
  console.log("Update Data:", data, "Error:", error)
}
testUpdate()
