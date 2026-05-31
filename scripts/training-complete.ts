import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function runTrainingComplete() {
  console.log('Training complete script started')
  
  const { data: sessions } = await supabase.from('training_sessions')
    .select('*')
    .lt('completed_at', new Date().toISOString())
    
  if (!sessions || sessions.length === 0) return console.log('No completed sessions')
  
  for (const session of sessions) {
    const { data: player } = await supabase.from('players').select('overall').eq('id', session.player_id).single()
    if (player) {
      const inc = Math.floor(Math.random() * 4) + 2 // 2 to 5
      let newOvr = player.overall + inc
      if (newOvr > 99) newOvr = 99
      
      await supabase.from('players').update({ overall: newOvr }).eq('id', session.player_id)
    }
    
    await supabase.from('training_sessions').delete().eq('id', session.id)
  }
  
  console.log('Training complete script done')
}

runTrainingComplete().catch(console.error)
