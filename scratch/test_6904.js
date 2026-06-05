import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function testStart() {
  const { data: league } = await supabaseAdmin.from('leagues').select('*').eq('id', '52b026de-2287-4795-844f-787aa0f61ea7').single()
  
  console.log("Invoking league-start-team-creation...")
  const { data, error } = await supabaseAdmin.functions.invoke('league-start-team-creation', {
    body: { league_id: league.id }
  })
  console.log("Response:", data, "Error:", error)
}
testStart()
