import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data: franchises } = await supabase.from('franchises').select('*');
  console.log('franchises:', franchises?.length);
  
  const { data: matches } = await supabase.from('matches').select('id, home_franchise_id, away_franchise_id, week, final_stats');
  console.log('matches:', matches?.length);
  if (matches?.length) {
    console.log(matches[0]);
  }
}
run();
