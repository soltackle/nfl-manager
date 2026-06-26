import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function testFillBots() {
  const { data: league } = await supabaseAdmin.from('leagues').select('*').eq('status', 'waiting').order('created_at', { ascending: false }).limit(1).single()
  
  if (!league) return console.log("No waiting league found")
  
  console.log("Invoking league-fill-bots on league:", league.name)
  const { data, error } = await supabaseAdmin.functions.invoke('league-fill-bots', {
    body: { league_id: league.id }
  })
  console.log("Response:", data, "Error:", error)
}
testFillBots()
