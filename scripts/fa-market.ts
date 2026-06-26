import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const TRAIT_POOL = {
  QB: ['Pocket Presence', 'Scrambler', 'Cannon Arm', 'Game Manager', 'Clutch', 'Field General', 'Gunslinger'],
  RB: ['Power Back', 'Elusive', 'Receiving Back', 'Workhorse', 'Goal Line Back', 'Home Run Hitter'],
  WR: ['Deep Threat', 'Possession', 'Red Zone Target', 'Route Runner', 'YAC Machine', 'Jump Ball Spec.'],
  TE: ['Blocking TE', 'Vertical Threat', 'Safety Blanket', 'Red Zone Target', 'YAC Machine'],
  OL: ['Pass Protector', 'Road Grader', 'Anchor', 'Puller', 'Ironman', 'Mauler'],
  DL: ['Edge Rusher', 'Run Stopper', 'Interior Penetrator', 'Bull Rusher', 'Finesse Rusher', 'Hit Power'],
  DE: ['Edge Rusher', 'Run Stopper', 'Interior Penetrator', 'Bull Rusher', 'Finesse Rusher', 'Hit Power'],
  LB: ['Coverage LB', 'Thumper', 'Sideline-to-Sideline', 'Blitz Specialist', 'Field General', 'Hit Power'],
  CB: ['Shutdown Corner', 'Ball Hawk', 'Press Coverage', 'Zone Specialist', 'Return Specialist', 'Acrobat'],
  S:  ['Hard Hitter', 'Center Fielder', 'Box Safety', 'Ball Hawk', 'Defensive Captain', 'Hit Power'],
  K:  ['Big Leg', 'Clutch', 'Accuracy', 'Kickoff Specialist'],
};

function generateTraits(overall, position) {
  let count = 0;
  if (overall >= 90) count = 3;
  else if (overall >= 75) count = 2;
  else count = Math.random() < 0.5 ? 1 : 2;

  const pool = TRAIT_POOL[position] || ['Clutch', 'Ironman', 'Team Player'];
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function calculatePlayerValue(baseValue, traitsCount) {
  let factor = 0.9;
  if (traitsCount === 3) factor = 1.2;
  else if (traitsCount === 2) factor = 1.1;
  else if (traitsCount === 1) factor = 1.0;
  return Math.floor(baseValue * factor);
}

async function runFaMarket() {
  console.log('FA Market cron started')
  
  // 1. Add 3 new players
  const positions = ['QB', 'RB', 'WR', 'TE', 'OL', 'DE', 'LB', 'CB', 'S']
  for (let i = 0; i < 3; i++) {
    const pos = positions[Math.floor(Math.random() * positions.length)]
    const ovr = 55 + Math.floor(Math.random() * 30)
    const baseValue = Math.pow((ovr - 50), 2) * 200 + Math.floor(Math.random() * 5000)
    const traits = generateTraits(ovr, pos)
    const finalValue = calculatePlayerValue(baseValue, traits.length)
    
    await supabase.from('players').insert({
      name: `FA ${pos} ${Math.floor(Math.random() * 1000)}`,
      position: pos,
      overall: ovr,
      value: finalValue,
      traits: traits,
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
