import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: matches } = await supabase.from('matches').select('*');
  console.log('matches count:', matches?.length);
  if (matches?.length) {
    console.log(matches[0]);
  }
}
run();
