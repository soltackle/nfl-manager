import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || 'https://rqlurvmugjyvwwqhtirn.supabase.co',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '...' // I need to pass the anon key and auth to invoke, or just use service role directly to hit DB and see what's wrong.
)
