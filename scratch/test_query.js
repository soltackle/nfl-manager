import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: leagues } = await supabase.from('leagues').select('*').limit(1);
  const { data: franchises } = await supabase.from('franchises').select('*').limit(2);
  
  if (leagues.length > 0 && franchises.length > 1) {
    const res = await supabase.from('matches').insert({
      league_id: leagues[0].id,
      home_franchise_id: franchises[0].id,
      away_franchise_id: franchises[1].id,
      week: 1,
      home_score: 0,
      away_score: 0,
      final_stats: null
    }).select();
    console.log('Inserted match:', res.data, res.error);

    // Now test the query:
    const query1 = await supabase
      .from('matches')
      .select('*')
      .is('final_stats->played', null);
    console.log('query1:', query1.data, query1.error);
  }
}
run();
