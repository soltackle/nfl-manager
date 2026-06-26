import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.functions.invoke('start-training', {
    body: { franchise_id: '9ed07037-c478-492c-a693-3ab5dd760c4a', player_ids: ['123'], slot: 'OC' }
  });
  console.log(data, error);
}
run();
