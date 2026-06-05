import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY) // ANON KEY might not have update rights if RLS is strict

// Actually we need the service key to bypass RLS, but we can just use an edge function to do it securely or since the user is admin, maybe I can just do it from the app or another edge function.
// Or I can just write the sql command for them to run in Supabase SQL editor:
// UPDATE leagues SET match_time_utc = '14:00:00';
