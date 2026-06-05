import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function simulate() {
  // Let's create a temporary draft session and try to simulate the edge function precisely
  // Or better, let's just fetch a league and see if we can trigger the same error manually
  
  // Find a league that is waiting and start it
  const { data: league } = await supabaseAdmin.from('leagues').select('*').limit(1).single()
  console.log("League:", league.name)
  
  const { data: leagueFranchises } = await supabaseAdmin
    .from('franchises')
    .select('id, user_id')
    .eq('league_id', league.id)
    .order('created_at', { ascending: true })

  console.log("Franchises:", leagueFranchises.length)
  
  const { data: usersData } = await supabaseAdmin
    .from('users')
    .select('id, role')
    .in('id', leagueFranchises.map(f => f.user_id))
    
  console.log("Users:", usersData.length)
  
  const userRoleMap = new Map(usersData?.map(u => [u.id, u.role]))
  console.log("User map:", userRoleMap)
  
  // If userRoleMap has all the users, there is no error here.
  
  // Let's check what else could throw an error.
  // Wait, could it be the loop condition?
  
  let currentRound = 1
  let currentFranchiseId = leagueFranchises[0].id
  
  let nextIndex = 0
  const currentIndex = leagueFranchises.findIndex(f => f.id === currentFranchiseId)
  const isEvenRound = currentRound % 2 === 0
  
  if (!isEvenRound) {
    nextIndex = currentIndex < leagueFranchises.length - 1 ? currentIndex + 1 : currentIndex
  } else {
    nextIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex
  }

  let nextRound = currentRound
  if ((!isEvenRound && currentIndex === leagueFranchises.length - 1) || (isEvenRound && currentIndex === 0)) {
    nextRound++
  }

  const nextFranchiseObj = leagueFranchises[nextIndex]
  console.log("Next franchise:", nextFranchiseObj)
  
  const nextOwnerRole = userRoleMap.get(nextFranchiseObj.user_id)
  console.log("Next owner role:", nextOwnerRole)
}

simulate().catch(e => console.error("Sim error:", e))
