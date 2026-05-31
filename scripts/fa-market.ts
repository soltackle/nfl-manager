import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function runFaMarket() {
  console.log('FA Market cron started')
  
  // 1. Add 3 new players
  const positions = ['QB', 'RB', 'WR', 'TE', 'OL', 'DE', 'LB', 'CB', 'S']
  for (let i = 0; i < 3; i++) {
    const pos = positions[Math.floor(Math.random() * positions.length)]
    const ovr = 55 + Math.floor(Math.random() * 30)
    const val = Math.pow((ovr - 50), 2) * 200 + Math.floor(Math.random() * 5000)
    
    await supabase.from('players').insert({
      name: `FA ${pos} ${Math.floor(Math.random() * 1000)}`,
      position: pos,
      overall: ovr,
      value: val,
      franchise_id: null
    })
  }
  
  // 2. Remove 20% of existing free agents
  const { data: fas } = await supabase.from('players').select('id').is('franchise_id', null)
  if (fas && fas.length > 0) {
    const removeCount = Math.floor(fas.length * 0.2)
    const shuffled = fas.sort(() => 0.5 - Math.random())
    const toRemove = shuffled.slice(0, removeCount).map(p => p.id)
    
    if (toRemove.length > 0) {
      await supabase.from('players').delete().in('id', toRemove)
    }
  }
  
  console.log('FA Market completed')
}

runFaMarket().catch(console.error)
