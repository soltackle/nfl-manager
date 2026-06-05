import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function testBotInsert() {
  const botId = crypto.randomUUID()
  const botName = 'Bot Bravo ' + Math.floor(Math.random() * 1000)
  
  console.log("Inserting profile...")
  const { data, error } = await supabaseAdmin.from('profiles').insert({
    id: botId,
    email: `${botName.replace(/\s/g, '').toLowerCase()}@bot.nflmanager.com`,
    username: botName,
    role: 'bot'
  })
  if (error) console.log("Profile Error:", error.message)
  else console.log("Profile Success")
}
testBotInsert()
