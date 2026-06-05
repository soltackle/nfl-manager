import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

async function testFetch() {
  const res = await fetch(process.env.VITE_SUPABASE_URL + '/functions/v1/league-fill-bots', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({ league_id: '4c43ba09-2ed3-4ff3-9878-57752e2586c0' }) // Some league id
  })
  
  const text = await res.text()
  console.log("Status:", res.status)
  console.log("Body:", text)
}
testFetch()
