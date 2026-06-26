import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function clearSlots() {
  const email = 'soltackle0@gmail.com'
  const password = 'qweqwe12'
  const { data: auth } = await supabase.auth.signInWithPassword({ email, password })
  const user = auth.user
  
  const { data: franchises } = await supabase.from('franchises').select('id, team_name').eq('user_id', user.id)
  console.log("Current franchises:", franchises)
  
  if (franchises && franchises.length > 0) {
    const targetId = franchises[0].id
    console.log(`Cleaning up franchise ${targetId} (${franchises[0].team_name}) to free up a slot...`)
    
    const { data: cleanData, error: cleanErr } = await supabase.functions.invoke('test-cleanup', {
      body: { franchise_id: targetId, delete_league: true }
    })
    
    if (cleanErr) console.error("❌ Cleanup failed:", cleanErr.message)
    else console.log("✅ Cleanup successful:", cleanData)
  } else {
    console.log("No franchises to clean up.")
  }
}
clearSlots()
