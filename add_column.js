import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function run() {
  const query = `ALTER TABLE leagues ADD COLUMN IF NOT EXISTS password TEXT;`
  
  // Since we can't run raw SQL easily via client, let's use the edge function to run rpc or we can just use the supabase CLI if it's installed.
  console.log('Use supabase cli to add column')
}
run()
