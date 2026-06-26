import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.rpc('get_tables_info'); 
  // actually postgres meta query:
  const { data: tables } = await supabase.from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public');
  console.log(tables?.map(t => t.table_name));
}
run();
