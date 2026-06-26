import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function check() {
  const { data: franchises, error } = await supabase.from('franchises').select('user_id')
  if (error) {
    console.error(error)
    return
  }
  
  const counts = {}
  franchises.forEach(f => {
    counts[f.user_id] = (counts[f.user_id] || 0) + 1
  })
  
  console.log("Franchise counts by user:", counts)
}
check()
