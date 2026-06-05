import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data: leagues } = await supabase.from('leagues').select('*');
  console.log('leagues:', leagues?.length);
  if (leagues?.length) {
    console.log(leagues.map(l => ({ id: l.id, status: l.status })));
  }
}
run();
