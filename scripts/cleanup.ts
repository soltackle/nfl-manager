import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function runCleanup() {
  console.log('Cleanup script started')
  
  const { error } = await supabase.from('match_drive_logs')
    .delete()
    .lt('expires_at', new Date().toISOString())
    
  if (error) {
    console.error('Failed to cleanup logs:', error)
  } else {
    console.log('Cleanup script done')
  }
}

runCleanup().catch(console.error)
