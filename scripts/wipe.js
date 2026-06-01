import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function wipe() {
  console.log("Wiping leagues...");
  const { error: e1 } = await supabase.from('leagues').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (e1) console.error(e1);
  else console.log("Leagues deleted. (Cascades to franchises, members, matches, draft_sessions, draft_picks, etc.)");

  console.log("Wiping remaining players (Free Agents)...");
  const { error: e2 } = await supabase.from('players').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (e2) console.error(e2);
  else console.log("Players deleted.");

  console.log("Done.");
}

wipe();
