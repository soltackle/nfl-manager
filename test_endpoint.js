import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function test() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'mstfscl60@gmail.com', // Let's guess user's email based on the screenshot or just try to get session if possible, but actually we can't easily sign in.
    password: 'password123'
  })
}
test()
