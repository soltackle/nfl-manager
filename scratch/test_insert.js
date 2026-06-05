import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function check() {
  const { data, error } = await supabase.from('leagues').insert({
    name: 'Test League',
    status: 'waiting',
    is_public: true,
    matchmaking_start_time: new Date().toISOString()
  }).select()
  console.log('Insert League Result:', data, error)
}
check()
