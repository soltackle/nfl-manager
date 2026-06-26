import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const res = await supabase.from('training_sessions').insert({
      franchise_id: '9ed07037-c478-492c-a693-3ab5dd760c4a',
      player_id: '12345678-1234-1234-1234-123456789012',
      completed_at: new Date().toISOString()
  });
  console.log(res);
}
run();
