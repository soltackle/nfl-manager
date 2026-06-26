import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data: auth, error: err } = await supabase.auth.signInWithPassword({
    email: 'admin@admin.com',
    password: 'password'
  });
  const franchise_id = '9ed07037-c478-492c-a693-3ab5dd760c4a'; // replace with admin franchise id
  const { data: franchises } = await supabase.from('franchises').select('id').eq('user_id', auth.user.id);
  
  if (franchises.length > 0) {
    const { data, error } = await supabase.functions.invoke('start-training', {
      body: { franchise_id: franchises[0].id, player_ids: ['invalid-id'], slot: 'OC' }
    });
    console.log(data, error);
  }
}
run();
