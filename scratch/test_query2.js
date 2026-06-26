import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  await supabase.from('matches').update({ final_stats: {} }).eq('id', 'ad9faf46-c531-4cc9-b1ed-7e378dfb7752');
  const query2 = await supabase
      .from('matches')
      .select('*')
      .is('final_stats->played', null);
  console.log('query2:', query2.data, query2.error);
}
run();
