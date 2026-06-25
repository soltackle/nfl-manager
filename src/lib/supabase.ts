import { createClient } from '@supabase/supabase-js'

// Supabase project: rohvwsfivpnnmagzexam
// These are PUBLIC client credentials — the anon key is meant to ship in the browser bundle and
// is protected by Row Level Security, so committing them is safe. They are hardwired here so the
// live site always connects to the correct project regardless of Vercel env-var state.
// To point at a different project later, edit the two constants below.
export const SUPABASE_URL = 'https://rohvwsfivpnnmagzexam.supabase.co'
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvaHZ3c2ZpdnBubm1hZ3pleGFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMjQ1MDcsImV4cCI6MjA5NzkwMDUwN30.aTyzmzD-jryb4cSHRSDufHtPCr_jerQwxH3lUF-CLGs'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
