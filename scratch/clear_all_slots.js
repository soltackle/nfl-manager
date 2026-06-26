import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function clearAllSlots() {
  const email = 'soltackle0@gmail.com'
  const password = 'qweqwe12'
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({ email, password })
  if (authErr) {
    console.error("Login failed:", authErr.message)
    return
  }
  const user = auth.user
  
  const { data: franchises } = await supabase.from('franchises').select('id, team_name').eq('user_id', user.id)
  console.log("Current franchises:", franchises)
  
  if (franchises && franchises.length > 0) {
    for (const f of franchises) {
      console.log(`Cleaning up franchise ${f.id} (${f.team_name})...`)
      
      const { data: cleanData, error: cleanErr } = await supabase.functions.invoke('test-cleanup', {
        body: { franchise_id: f.id, delete_league: true }
      })
      
      if (cleanErr) console.error(`❌ Cleanup failed for ${f.id}:`, cleanErr.message)
      else console.log(`✅ Cleanup successful for ${f.id}:`, cleanData)
    }
  } else {
    console.log("No franchises to clean up.")
  }
}
clearAllSlots()
