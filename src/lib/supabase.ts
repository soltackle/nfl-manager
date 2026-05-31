import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  (('https://rqlurvmugjyvwwqhtirn.supabase.co') || 'https://rqlurvmugjyvwwqhtirn.supabase.co') || 'https://placeholder.supabase.co',
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder'
)
