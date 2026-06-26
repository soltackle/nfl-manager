import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function testStart() {
  console.log("Invoking league-start-team-creation on 4392...")
  const { data, error } = await supabaseAdmin.functions.invoke('league-start-team-creation', {
    body: { league_id: '13b252d1-dd1a-4db3-8f12-17db70241c7b' }
  })
  console.log("Response:", data, "Error:", error)
}
testStart()
