import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL || 'YOUR_URL',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_KEY'
)

async function run() {
  const { data, error } = await supabase.from('users').update({ amfutcoin: 500 }).eq('email', 'soltackle0@gmail.com')
  console.log(data, error)
}
run()
