import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function testAlreadyStarted() {
  const { data, error } = await supabaseAdmin.functions.invoke('league-fill-bots', {
    body: { league_id: '52b026de-2287-4795-844f-787aa0f61ea7' }
  })
  console.log("Response:", data, "Error:", error)
}
testAlreadyStarted()
